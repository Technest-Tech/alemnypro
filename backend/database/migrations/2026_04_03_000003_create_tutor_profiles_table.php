<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tutor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('headline_ar')->nullable();
            $table->string('headline_en')->nullable();
            $table->text('bio_ar')->nullable();
            $table->text('bio_en')->nullable();
            $table->unsignedSmallInteger('experience_years')->default(0);
            $table->string('education')->nullable();
            $table->decimal('hourly_rate', 8, 2)->default(0);
            $table->string('currency', 3)->default('EGP');
            $table->enum('lesson_format', ['online', 'in_person', 'both'])->default('both');
            $table->boolean('is_first_lesson_free')->default(false);
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->foreignId('governorate_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('city_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('neighborhood_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('total_students')->default(0);
            $table->unsignedInteger('total_reviews')->default(0);
            $table->decimal('avg_rating', 2, 1)->default(0);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            // Performance indexes for search
            $table->index(['governorate_id', 'city_id', 'neighborhood_id'], 'idx_tutor_location');
            $table->index('hourly_rate');
            $table->index('avg_rating');
            $table->index('verification_status');
            $table->index('is_featured');
            $table->index('lesson_format');
        });

        Schema::create('tutor_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tutor_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced'])->default('intermediate');
            $table->timestamps();

            $table->unique(['tutor_profile_id', 'subject_id']);
            $table->index('subject_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tutor_subjects');
        Schema::dropIfExists('tutor_profiles');
    }
};
