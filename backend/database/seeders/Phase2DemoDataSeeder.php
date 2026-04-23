<?php

namespace Database\Seeders;

use App\Models\Approval;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\DocumentVersion;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use App\Models\WorkflowTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class Phase2DemoDataSeeder extends Seeder
{
    /**
     * Seed demo records for Phase 2 manual verification.
     */
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => '2022jfevasco@live.mcl.edu.ph'],
            [
                'name' => 'Joshua Evasco',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'admin',
            ]
        );

        $staff = User::updateOrCreate(
            ['email' => 'staff.demo@sao-is.local'],
            [
                'name' => 'Staff Demo',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'staff',
            ]
        );

        $student = User::updateOrCreate(
            ['email' => 'student.demo@sao-is.local'],
            [
                'name' => 'Student Demo',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'student',
            ]
        );

        $faculty = User::updateOrCreate(
            ['email' => 'faculty.demo@sao-is.local'],
            [
                'name' => 'Faculty Demo',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'faculty',
            ]
        );

        $template = WorkflowTemplate::updateOrCreate(
            ['name' => 'General Clearance Workflow'],
            [
                'description' => 'Baseline workflow used for Phase 2 verification records.',
                'created_by' => $admin->id,
            ]
        );

        $adminStep = WorkflowStep::updateOrCreate(
            ['template_id' => $template->id, 'step_order' => 1],
            [
                'name' => 'Admin Review',
                'assignee_role' => 'admin',
                'assignee_user_id' => $admin->id,
            ]
        );

        $staffStep = WorkflowStep::updateOrCreate(
            ['template_id' => $template->id, 'step_order' => 2],
            [
                'name' => 'Staff Validation',
                'assignee_role' => 'staff',
                'assignee_user_id' => $staff->id,
            ]
        );

        $facultyStep = WorkflowStep::updateOrCreate(
            ['template_id' => $template->id, 'step_order' => 3],
            [
                'name' => 'Faculty Endorsement',
                'assignee_role' => 'faculty',
                'assignee_user_id' => $faculty->id,
            ]
        );

        $documentType = DocumentType::updateOrCreate(
            ['name' => 'Student Clearance Form'],
            [
                'workflow_template_id' => $template->id,
                'expiry_days' => 365,
            ]
        );

        $pendingDocument = Document::updateOrCreate(
            ['title' => 'Phase 2 Demo Pending Clearance'],
            [
                'document_type_id' => $documentType->id,
                'submitted_by' => $student->id,
                'status' => 'pending',
                'current_step_id' => $adminStep->id,
            ]
        );

        WorkflowInstance::updateOrCreate(
            ['document_id' => $pendingDocument->id],
            [
                'template_id' => $template->id,
                'current_step_order' => 1,
                'status' => 'in_progress',
            ]
        );

        $historyDocument = Document::updateOrCreate(
            ['title' => 'Phase 2 Demo Reviewed Clearance'],
            [
                'document_type_id' => $documentType->id,
                'submitted_by' => $student->id,
                'status' => 'approved',
                'current_step_id' => null,
            ]
        );

        $historyInstance = WorkflowInstance::updateOrCreate(
            ['document_id' => $historyDocument->id],
            [
                'template_id' => $template->id,
                'current_step_order' => 3,
                'status' => 'completed',
                'completed_at' => now()->subDay(),
            ]
        );

        Approval::updateOrCreate(
            [
                'workflow_instance_id' => $historyInstance->id,
                'step_id' => $adminStep->id,
                'reviewed_by' => $admin->id,
            ],
            [
                'decision' => 'approved',
                'remarks' => 'Demo approval seeded for history view.',
                'reviewed_at' => now()->subDays(2),
            ]
        );

        DocumentVersion::updateOrCreate(
            ['document_id' => $pendingDocument->id, 'version_number' => 1],
            [
                'file_path' => 'demo/phase2-pending-clearance-v1.pdf',
                'original_filename' => 'phase2-pending-clearance-v1.pdf',
                'mime_type' => 'application/pdf',
                'file_size_bytes' => 24576,
                'uploaded_by' => $student->id,
            ]
        );

        DocumentVersion::updateOrCreate(
            ['document_id' => $historyDocument->id, 'version_number' => 1],
            [
                'file_path' => 'demo/phase2-reviewed-clearance-v1.pdf',
                'original_filename' => 'phase2-reviewed-clearance-v1.pdf',
                'mime_type' => 'application/pdf',
                'file_size_bytes' => 32768,
                'uploaded_by' => $student->id,
            ]
        );

        Notification::updateOrCreate(
            ['user_id' => $admin->id, 'message' => 'Demo: 1 pending admin review is ready.'],
            [
                'document_id' => $pendingDocument->id,
                'is_read' => false,
            ]
        );

        Notification::updateOrCreate(
            ['user_id' => $student->id, 'message' => 'Demo: Your reviewed clearance was approved.'],
            [
                'document_id' => $historyDocument->id,
                'is_read' => false,
            ]
        );
    }
}
