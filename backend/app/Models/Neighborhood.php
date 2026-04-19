<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Neighborhood extends Model
{
    protected $fillable = ['city_id', 'name_ar', 'name_en', 'slug'];
    public $timestamps = false;

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function name(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
