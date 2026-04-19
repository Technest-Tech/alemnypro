<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('curriculum', ['thanaweya', 'igcse', 'american', 'ib', 'university', 'other'])->nullable();
            $table->string('grade_level')->nullable();
            $table->foreignId('parent_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('parent_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
