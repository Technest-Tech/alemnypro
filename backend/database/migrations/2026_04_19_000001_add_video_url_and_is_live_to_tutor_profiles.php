<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            // YouTube intro video URL
            $table->string('video_url', 500)->nullable()->after('location_label');
            // Listing visibility toggle (tutor can hide their ad)
            $table->boolean('is_live')->default(true)->after('video_url');
        });
    }

    public function down(): void
    {
        Schema::table('tutor_profiles', function (Blueprint $table) {
            $table->dropColumn(['video_url', 'is_live']);
        });
    }
};
