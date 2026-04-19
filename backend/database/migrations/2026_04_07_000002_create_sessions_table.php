<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_sessions', function (Blueprint $table) {
            $table->id();

            // ─── Relations ───
            $table->foreignId('booking_request_id')->constrained('booking_requests')->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();

            // ─── Scheduling ───
            $table->unsignedTinyInteger('session_number')->default(1); // 1st, 2nd, 3rd lesson in this package
            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->enum('lesson_format', ['online', 'in_person']);
            $table->string('meeting_link')->nullable();   // Zoom/Meet URL (added by tutor)
            $table->string('recording_link')->nullable(); // Google Drive/YouTube proof link
            $table->text('tutor_notes')->nullable();

            // ─── Status ───
            $table->enum('status', [
                'scheduled',    // Lesson is booked & upcoming
                'completed',    // Tutor marked complete — 48h window open for student
                'disputed',     // Student raised a dispute within 48h window
                'confirmed',    // Auto-confirmed after 48h, or admin confirmed — payout released
                'cancelled',    // Cancelled before it happened
            ])->default('scheduled');

            $table->dateTime('completed_at')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('dispute_window_ends')->nullable(); // completed_at + N hours (from platform_settings)
            $table->string('cancelled_reason')->nullable();

            // ─── Financials (snapshots at session creation time) ───
            $table->decimal('platform_fee_pct', 5, 2);  // snapshot from platform_settings
            $table->decimal('gross_amount', 10, 2);      // full lesson value paid by student
            $table->decimal('platform_fee', 10, 2);      // gross × fee_pct / 100
            $table->decimal('tutor_payout', 10, 2);      // gross − platform_fee
            $table->dateTime('payout_released_at')->nullable();

            $table->timestamps();

            // ─── Indexes ───
            $table->index('booking_request_id');
            $table->index('tutor_id');
            $table->index('student_id');
            $table->index('status');
            $table->index(['tutor_id', 'status']);
            $table->index(['student_id', 'status']);
            $table->index('scheduled_at');
            $table->index('dispute_window_ends');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_sessions');
    }
};
