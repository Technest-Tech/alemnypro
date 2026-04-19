<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_subjects', function (Blueprint $table) {
            // Grade levels the tutor teaches for this specific subject
            // e.g. ["primary","preparatory","secondary","university","adults"]
            $table->json('levels')->nullable()->after('proficiency_level');

            // Per-subject hourly rate — overrides tutor_profiles.hourly_rate if set
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('levels');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_subjects', function (Blueprint $table) {
            $table->dropColumn(['levels', 'hourly_rate']);
        });
    }
};
