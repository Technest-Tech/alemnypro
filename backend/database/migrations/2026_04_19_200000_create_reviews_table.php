<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // Who is being reviewed
            $table->foreignId('tutor_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Who wrote the review
            $table->foreignId('student_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Optional link to the booking that triggered this review
            $table->foreignId('booking_id')
                  ->nullable()
                  ->constrained('booking_requests')
                  ->nullOnDelete();

            // Core fields
            $table->unsignedTinyInteger('rating');          // 1–5
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(true);

            $table->timestamps();

            // Prevent a student from reviewing the same tutor+booking twice
            $table->unique(['tutor_id', 'student_id', 'booking_id']);

            // Fast lookups
            $table->index(['tutor_id', 'is_published', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
