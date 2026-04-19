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
        Schema::create('group_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            
            $table->enum('status', ['enrolled', 'cancelled', 'refunded'])->default('enrolled');
            $table->decimal('amount_paid', 8, 2);
            $table->enum('payment_status', ['held', 'released', 'refunded'])->default('held');
            
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            
            $table->timestamps();

            // Indexes
            $table->index('group_session_id');
            $table->index('student_id');
            $table->unique(['group_session_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('group_enrollments');
    }
};
