<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    protected $fillable = ['governorate_id', 'name_ar', 'name_en', 'slug'];
    public $timestamps = false;

    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    public function neighborhoods()
    {
        return $this->hasMany(Neighborhood::class);
    }

    public function name(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
