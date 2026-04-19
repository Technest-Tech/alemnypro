<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_profile_id')->constrained()->cascadeOnDelete();

            $table->enum('type', [
                'national_id_front',
                'national_id_back',
                'criminal_record',
                'university_degree',
                'other',
            ]);

            // Local storage path (swappable to S3 path later)
            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 50);
            $table->unsignedInteger('file_size'); // bytes

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['tutor_profile_id', 'type']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_documents');
    }
};
