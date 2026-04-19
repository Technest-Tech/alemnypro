<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // Predefined levels that tutors can pick from for this subject
            // e.g. ["primary","preparatory","secondary_1","secondary_2","secondary_3","university","adults","children","beginner","intermediate","advanced"]
            $table->json('levels')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('levels');
        });
    }
};
