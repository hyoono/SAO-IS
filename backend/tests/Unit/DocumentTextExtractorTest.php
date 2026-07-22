<?php

namespace Tests\Unit;

use App\Services\DocumentTextExtractor;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use PHPUnit\Framework\TestCase;
use ZipArchive;

class DocumentTextExtractorTest extends TestCase
{
    public function test_it_extracts_docx_text(): void
    {
        $path = $this->makeDocx('Foundation Day Clearance', 'Submit before Friday.');

        try {
            $text = (new DocumentTextExtractor())->extract(
                $path,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'clearance.docx'
            );

            $this->assertStringContainsString('Foundation Day Clearance', $text);
            $this->assertStringContainsString('Submit before Friday.', $text);
        } finally {
            @unlink($path);
        }
    }

    public function test_it_extracts_xlsx_rows(): void
    {
        $path = $this->temporaryOfficePath('sao-xlsx-', 'xlsx');
        $writer = new XlsxWriter();
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues(['Name', 'Status']));
        $writer->addRow(Row::fromValues(['Foundation Day', 'Approved']));
        $writer->close();

        try {
            $text = (new DocumentTextExtractor())->extract(
                $path,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'report.xlsx'
            );

            $this->assertStringContainsString('Sheet:', $text);
            $this->assertStringContainsString('Name,Status', $text);
            $this->assertStringContainsString('Foundation Day,Approved', $text);
        } finally {
            @unlink($path);
        }
    }

    private function makeDocx(string ...$paragraphs): string
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

        return $path;
    }

    private function temporaryOfficePath(string $prefix, string $extension): string
    {
        $path = tempnam(sys_get_temp_dir(), $prefix);
        @unlink($path);

        return "{$path}.{$extension}";
    }
}
