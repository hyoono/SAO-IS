<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'director' and 'center_head' to the assignee_role enum in workflow_steps.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE workflow_steps MODIFY COLUMN assignee_role ENUM('admin','staff','org_officer','student','faculty','director','center_head') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE workflow_steps MODIFY COLUMN assignee_role ENUM('admin','staff','org_officer','student','faculty') NOT NULL");
    }
};
