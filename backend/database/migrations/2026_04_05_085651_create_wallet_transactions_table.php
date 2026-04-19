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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->enum('type', ['credit', 'debit', 'hold', 'release', 'refund', 'penalty']);
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_after', 10, 2);
            
            $table->nullableMorphs('reference'); // reference_type, reference_id
            
            $table->string('description_ar')->nullable();
            $table->string('description_en')->nullable();
            
            $table->timestamps();

            // Indexes
            $table->index('user_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
