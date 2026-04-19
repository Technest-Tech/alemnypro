<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();

            $table->enum('type', [
                'text',
                'booking_request',
                'booking_accepted',
                'booking_rejected',
                'date_proposal',
                'date_confirmed',
                'lesson_type_set',
                'payment_link',
                'payment_completed',
                'contact_shared',
                'system',
            ])->default('text');

            $table->text('body')->nullable();       // Free-text content
            $table->jsonb('metadata')->nullable();   // Structured data per type
            $table->boolean('is_read')->default(false);

            $table->timestamps();

            $table->index('booking_request_id');
            $table->index(['booking_request_id', 'created_at']);
            $table->index(['booking_request_id', 'is_read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_messages');
    }
};
