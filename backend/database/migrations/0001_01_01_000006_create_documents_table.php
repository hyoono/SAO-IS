<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('document_type_id')->constrained('document_types')->onDelete('cascade');
            $table->foreignUuid('submitted_by')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->enum('status', [
                'pending',
                'in_review',
                'approved',
                'rejected',
                'awaiting_info',
                'archived',
            ])->default('pending');
            $table->foreignUuid('current_step_id')
                ->nullable()
                ->constrained('workflow_steps')
                ->onDelete('set null'); // Null when approved/archived
            $table->date('expires_at')->nullable(); // Null uses doc_type.expiry_days to calculate
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
