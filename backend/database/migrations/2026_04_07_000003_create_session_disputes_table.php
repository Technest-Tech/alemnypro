<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_disputes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('session_id')->constrained('lesson_sessions')->cascadeOnDelete();
            $table->foreignId('raised_by')->constrained('users')->cascadeOnDelete(); // always the student
            $table->text('reason');
            $table->string('evidence_link')->nullable(); // optional link student provides

            $table->enum('status', [
                'open',              // Awaiting admin review
                'resolved_tutor',    // Admin ruled in tutor's favour — payout released
                'resolved_student',  // Admin ruled in student's favour — refund issued
                'closed',            // Closed without resolution
            ])->default('open');

            $table->text('admin_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('resolved_at')->nullable();

            $table->timestamps();

            $table->index('session_id');
            $table->index('status');
            $table->index('raised_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_disputes');
    }
};
