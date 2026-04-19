<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectCategory extends Model
{
    protected $fillable = ['name_ar', 'name_en', 'slug', 'icon', 'sort_order'];

    public function subjects()
    {
        return $this->hasMany(Subject::class, 'category_id');
    }

    public function name(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
