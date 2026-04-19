<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            // Unique token for public payment page link
            $table->string('payment_token', 64)->nullable()->unique()->after('sessions_scheduled');

            // Trial class vs real lessons
            $table->enum('lesson_type', ['trial', 'lessons'])->nullable()->after('payment_token');

            // Mutually agreed date and time (after negotiation)
            $table->date('confirmed_date')->nullable()->after('lesson_type');
            $table->time('confirmed_time')->nullable()->after('confirmed_date');
        });
    }

    public function down(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            $table->dropColumn(['payment_token', 'lesson_type', 'confirmed_date', 'confirmed_time']);
        });
    }
};
