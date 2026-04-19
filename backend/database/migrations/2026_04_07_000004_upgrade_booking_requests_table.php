<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            $table->unsignedTinyInteger('lessons_count')->default(1)->after('hourly_rate');
            $table->decimal('total_amount', 10, 2)->nullable()->after('lessons_count');       // lessons_count × hourly_rate
            $table->decimal('per_lesson_amount', 10, 2)->nullable()->after('total_amount');   // = hourly_rate (convenience)

            $table->enum('payment_status', [
                'unpaid',             // Booking accepted but not yet paid
                'paid',               // Student paid — money held in escrow
                'partially_released', // Some sessions confirmed & paid out
                'fully_released',     // All sessions confirmed & paid out
            ])->default('unpaid')->after('per_lesson_amount');

            $table->dateTime('paid_at')->nullable()->after('payment_status');
            $table->unsignedTinyInteger('sessions_scheduled')->default(0)->after('paid_at'); // how many sessions tutor has created so far

            $table->index('payment_status');
        });
    }

    public function down(): void
    {
        Schema::table('booking_requests', function (Blueprint $table) {
            $table->dropColumn([
                'lessons_count',
                'total_amount',
                'per_lesson_amount',
                'payment_status',
                'paid_at',
                'sessions_scheduled',
            ]);
        });
    }
};
