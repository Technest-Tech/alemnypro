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
        Schema::create('group_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            
            $table->string('title_ar');
            $table->string('title_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            
            $table->enum('lesson_format', ['online', 'in_person']);
            $table->enum('pricing_model', ['per_seat', 'monthly_subscription']);
            $table->decimal('seat_price', 8, 2);
            
            $table->unsignedTinyInteger('max_capacity');
            $table->unsignedTinyInteger('min_threshold');
            $table->boolean('is_first_session_free')->default(false);
            
            $table->enum('status', ['draft', 'open', 'confirmed', 'completed', 'cancelled'])->default('draft');
            
            $table->date('session_date');
            $table->time('session_time');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            
            $table->enum('recurrence', ['none', 'weekly', 'monthly'])->default('none');
            
            $table->string('meeting_link')->nullable();
            $table->string('group_chat_id')->nullable();
            
            $table->timestamp('threshold_checked_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            
            $table->string('cancellation_reason')->nullable();
            $table->text('tutor_report')->nullable();
            
            $table->timestamps();

            // Indexes
            $table->index('tutor_id');
            $table->index('subject_id');
            $table->index('status');
            $table->index('session_date');
            $table->index(['status', 'session_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_sessions');
    }
};
