<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Governorate extends Model
{
    protected $fillable = ['name_ar', 'name_en', 'slug'];
    public $timestamps = false;

    public function cities()
    {
        return $this->hasMany(City::class);
    }

    public function name(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
