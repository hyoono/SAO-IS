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
        Schema::create('approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workflow_instance_id')->constrained('workflow_instances')->onDelete('cascade');
            $table->foreignUuid('step_id')->constrained('workflow_steps')->onDelete('cascade');
            $table->foreignUuid('reviewed_by')->constrained('users')->onDelete('cascade');
            $table->enum('decision', ['approved', 'rejected', 'requested_info']);
            $table->text('remarks')->nullable();
            $table->timestamp('reviewed_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
