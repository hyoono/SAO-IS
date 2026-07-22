<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\DocumentVersion;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTemplate;
use App\Services\NotificationService;
use App\Services\OllamaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Tests\TestCase;
use ZipArchive;

class AiDocumentEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_docx_verification_extracts_text_into_ai_prompt(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $version = $this->storeVersion($fixture['document'], 'clearance.docx', $this->makeDocxBytes('Foundation Day Clearance'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $this->mock(OllamaService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')
                ->once()
                ->withArgs(function (string $prompt): bool {
                    $this->assertStringContainsString('Foundation Day Clearance', $prompt);
                    return true;
                })
                ->andReturn('{"is_valid":true,"confidence":94,"reasoning":"The document is complete."}');
        });

        $response = $this->actingAs($fixture['staff'])->postJson('/api/v1/ai/verify-document', [
            'version_id' => $version->id,
            'expected_type' => 'Clearance',
        ]);

        $response->assertOk()
            ->assertJsonPath('is_valid', true)
            ->assertJsonPath('confidence', 94);
    }

    public function test_xlsx_extraction_extracts_rows_into_ai_prompt(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $version = $this->storeVersion($fixture['document'], 'report.xlsx', $this->makeXlsxBytes([
            ['Name', 'Status'],
            ['Foundation Day', 'Approved'],
        ]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->mock(OllamaService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')
                ->once()
                ->withArgs(function (string $prompt): bool {
                    $this->assertStringContainsString('Name,Status', $prompt);
                    $this->assertStringContainsString('Foundation Day,Approved', $prompt);
                    return true;
                })
                ->andReturn('{"Name":"Foundation Day","Status":"Approved"}');
        });

        $response = $this->actingAs($fixture['staff'])->postJson('/api/v1/ai/extract', [
            'version_id' => $version->id,
            'expected_fields' => ['Name', 'Status'],
        ]);

        $response->assertOk()
            ->assertJsonPath('extracted_data.Name', 'Foundation Day')
            ->assertJsonPath('extracted_data.Status', 'Approved');
    }

    public function test_unsupported_stored_file_returns_422(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $version = $this->storeVersion($fixture['document'], 'notes.txt', 'plain text', 'text/plain');

        $response = $this->actingAs($fixture['staff'])->postJson('/api/v1/ai/extract', [
            'version_id' => $version->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_center_head_cannot_use_ai_on_other_center_document(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $otherCenter = Center::create(['code' => 'CSA', 'name' => 'Center for Student Activities']);
        $otherCenterHead = User::create([
            'name' => 'Other Head',
            'email' => 'other-head@example.test',
            'role' => 'center_head',
            'center_id' => $otherCenter->id,
        ]);
        $version = $this->storeVersion($fixture['document'], 'clearance.docx', $this->makeDocxBytes('Private clearance'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $response = $this->actingAs($otherCenterHead)->postJson('/api/v1/ai/verify-document', [
            'version_id' => $version->id,
            'expected_type' => 'Clearance',
        ]);

        $response->assertForbidden();
    }

    public function test_unassigned_reviewer_cannot_approve_document(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $faculty = User::create([
            'name' => 'Faculty Reviewer',
            'email' => 'faculty@example.test',
            'role' => 'faculty',
        ]);

        $response = $this->actingAs($faculty)->postJson("/api/v1/documents/{$fixture['document']->id}/approve");

        $response->assertForbidden();
    }

    public function test_recommend_approval_uses_latest_version(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();
        $this->storeVersion($fixture['document'], 'old.docx', $this->makeDocxBytes('Old version'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1);
        $this->storeVersion($fixture['document'], 'latest.docx', $this->makeDocxBytes('Latest version for review'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2);

        $this->mock(OllamaService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')
                ->once()
                ->withArgs(function (string $prompt): bool {
                    $this->assertStringContainsString('Latest version for review', $prompt);
                    $this->assertStringNotContainsString('Old version', $prompt);
                    return true;
                })
                ->andReturn('{"recommendation":"Approve","reasoning":"The latest document is complete."}');
        });

        $response = $this->actingAs($fixture['staff'])->postJson('/api/v1/ai/recommend-approval', [
            'document_id' => $fixture['document']->id,
            'step_name' => 'Staff Review',
        ]);

        $response->assertOk()
            ->assertJsonPath('recommendation', 'Approve');
    }

    public function test_notification_ai_failure_falls_back_to_raw_message(): void
    {
        Storage::fake('local');
        $fixture = $this->createReviewFixture();

        $this->mock(OllamaService::class, function (MockInterface $mock): void {
            $mock->shouldReceive('generate')->once()->andReturnNull();
        });

        $notification = app(NotificationService::class)->notifySubmitter(
            $fixture['student']->id,
            $fixture['document']->id,
            'Your document was approved.'
        );

        $this->assertSame('Your document was approved.', $notification->message);
    }

    /**
     * @return array{admin: User, staff: User, student: User, center: Center, document: Document}
     */
    private function createReviewFixture(): array
    {
        $center = Center::create(['code' => 'CSAD', 'name' => 'Center for Student Affairs and Discipline']);
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'role' => 'admin']);
        $staff = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'role' => 'staff']);
        $student = User::create(['name' => 'Student', 'email' => 'student@example.test', 'role' => 'student']);

        $template = WorkflowTemplate::create([
            'name' => 'Clearance Workflow',
            'created_by' => $admin->id,
        ]);

        $step = WorkflowStep::create([
            'template_id' => $template->id,
            'step_order' => 1,
            'name' => 'Staff Review',
            'assignee_role' => 'staff',
            'assignee_user_id' => null,
            'center_id' => null,
        ]);

        $documentType = DocumentType::create([
            'name' => 'Clearance',
            'workflow_template_id' => $template->id,
            'center_id' => $center->id,
        ]);

        $document = Document::create([
            'document_type_id' => $documentType->id,
            'submitted_by' => $student->id,
            'title' => 'Foundation Day Clearance',
            'status' => 'in_review',
            'current_step_id' => $step->id,
        ]);

        WorkflowInstance::create([
            'document_id' => $document->id,
            'template_id' => $template->id,
            'current_step_order' => 1,
            'status' => 'in_progress',
        ]);

        return compact('admin', 'staff', 'student', 'center', 'document');
    }

    private function storeVersion(Document $document, string $filename, string $contents, string $mimeType, int $versionNumber = 1): DocumentVersion
    {
        $path = "documents/{$document->id}/v{$versionNumber}/{$filename}";
        Storage::disk('local')->put($path, $contents);

        return DocumentVersion::create([
            'document_id' => $document->id,
            'version_number' => $versionNumber,
            'file_path' => $path,
            'original_filename' => $filename,
            'mime_type' => $mimeType,
            'file_size_bytes' => strlen($contents),
            'uploaded_by' => $document->submitted_by,
        ]);
    }

    private function makeDocxBytes(string ...$paragraphs): string
    {
        $path = $this->temporaryOfficePath('sao-docx-', 'docx');
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');

        $body = '';
        foreach ($paragraphs as $paragraph) {
            $body .= '<w:p><w:r><w:t>' . htmlspecialchars($paragraph, ENT_XML1) . '</w:t></w:r></w:p>';
        }

        $zip->addFromString('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' . $body . '</w:body></w:document>');
        $zip->close();

        try {
            return file_get_contents($path);
        } finally {
            @unlink($path);
        }
    }

    /**
     * @param array<int, array<int, string>> $rows
     */
    private function makeXlsxBytes(array $rows): string
    {
        $path = $this->temporaryOfficePath('sao-xlsx-', 'xlsx');
        $writer = new XlsxWriter();
        $writer->openToFile($path);
        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();

        try {
            return file_get_contents($path);
        } finally {
            @unlink($path);
        }
    }

    private function temporaryOfficePath(string $prefix, string $extension): string
    {
        $path = tempnam(sys_get_temp_dir(), $prefix);
        @unlink($path);

        return "{$path}.{$extension}";
    }
}
