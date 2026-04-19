<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            // Onboarding state machine
            $table->unsignedTinyInteger('onboarding_step')->default(0)->after('id');
            $table->enum('onboarding_status', ['draft', 'pending_review', 'approved', 'rejected'])
                ->default('draft')->after('onboarding_step');
            $table->text('rejection_reason')->nullable()->after('onboarding_status');

            // Format & Location details (Step 3)
            $table->json('lesson_format_details')->nullable()->after('lesson_format');
            // Stores: { formats: ["online","my_place","student_place"], travel_radius_km: 10, location_lat: null, location_lng: null, location_label: "Maadi, Cairo" }

            // Group pricing details (Step 4)
            $table->json('group_pricing')->nullable()->after('hourly_rate');
            // Stores: { enabled: true, price_per_seat: 75, min_threshold: 3, max_capacity: 10 }

            $table->boolean('is_first_trial_free')->default(false)->after('is_first_lesson_free');
            $table->unsignedSmallInteger('trial_duration_minutes')->default(30)->after('is_first_trial_free');

            // Index for fast onboarding queries
            $table->index(['onboarding_status', 'onboarding_step']);
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'onboarding_step',
                'onboarding_status',
                'rejection_reason',
                'lesson_format_details',
                'group_pricing',
                'is_first_trial_free',
                'trial_duration_minutes',
            ]);
        });
    }
};
