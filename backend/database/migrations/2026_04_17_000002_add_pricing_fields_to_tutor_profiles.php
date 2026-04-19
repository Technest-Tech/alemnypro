<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            // About the courses (separate from personal bio)
            $table->text('bio_method_ar')->nullable()->after('bio_en');
            $table->text('bio_method_en')->nullable()->after('bio_method_ar');

            // Pricing extensions
            $table->decimal('hourly_rate_online', 10, 2)->nullable()->after('hourly_rate');
            $table->decimal('pack_5h_price', 10, 2)->nullable()->after('hourly_rate_online');
            $table->decimal('pack_10h_price', 10, 2)->nullable()->after('pack_5h_price');
            $table->decimal('travel_expenses', 10, 2)->nullable()->after('pack_10h_price');
            $table->string('first_lesson_duration', 10)->nullable()->default('60')->after('trial_duration_minutes');

            // Education level (from onboarding field, now exposed in listings)
            $table->string('education_level', 255)->nullable()->after('education');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'bio_method_ar',
                'bio_method_en',
                'hourly_rate_online',
                'pack_5h_price',
                'pack_10h_price',
                'travel_expenses',
                'first_lesson_duration',
                'education_level',
            ]);
        });
    }
};
