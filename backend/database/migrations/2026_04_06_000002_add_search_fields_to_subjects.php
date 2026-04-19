<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            // JSON array of synonym strings: ["Math","رياضيات","حساب","Maths"]
            $table->json('synonyms')->nullable()->after('icon');
            // Space-separated keywords for full-text matching
            $table->text('search_keywords')->nullable()->after('synonyms');

            $table->index('search_keywords');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex(['search_keywords']);
            $table->dropColumn(['synonyms', 'search_keywords']);
        });
    }
};
