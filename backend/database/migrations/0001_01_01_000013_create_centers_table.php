<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('centers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Add center_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('center_id')->nullable()->constrained('centers')->onDelete('set null');
        });

        // Add center_id to document_types
        Schema::table('document_types', function (Blueprint $table) {
            $table->foreignUuid('center_id')->nullable()->constrained('centers')->onDelete('set null');
        });

        // Add center_id to workflow_steps
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->foreignUuid('center_id')->nullable()->constrained('centers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('workflow_steps', function (Blueprint $table) {
            $table->dropForeign(['center_id']);
            $table->dropColumn('center_id');
        });
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropForeign(['center_id']);
            $table->dropColumn('center_id');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['center_id']);
            $table->dropColumn('center_id');
        });
        Schema::dropIfExists('centers');
    }
};
