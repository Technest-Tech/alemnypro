<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->enum('lesson_format', ['online', 'in_person']);
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected', 'completed', 'cancelled'])->default('pending');
            $table->date('preferred_date')->nullable();
            $table->time('preferred_time')->nullable();
            $table->decimal('hourly_rate', 8, 2);
            $table->timestamps();

            $table->index('student_id');
            $table->index('tutor_id');
            $table->index('status');
            $table->index(['tutor_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_requests');
    }
};
