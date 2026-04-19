<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_payout_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_id')->constrained('users')->cascadeOnDelete();
            $table->enum('method', ['vodafone_cash', 'instapay', 'bank_transfer'])->default('vodafone_cash');
            $table->string('account_number')->nullable(); // phone number or IBAN
            $table->string('account_name')->nullable();   // account holder name
            $table->boolean('is_default')->default(true);
            $table->enum('status', ['active', 'pending_verification', 'rejected'])->default('active');
            $table->timestamps();

            // Each tutor can have one preference per method
            $table->unique(['tutor_id', 'method']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_payout_preferences');
    }
};
