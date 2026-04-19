<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PlatformSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'label_en',
        'label_ar',
        'description_en',
        'description_ar',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    // ─── Cache Key ───────────────────────────────────────────────

    private static string $cacheKey = 'platform_settings_all';
    private static int    $cacheTtl = 3600; // 1 hour

    // ─── Static Helpers ──────────────────────────────────────────

    /**
     * Get a single setting value, cast to its native type.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $settings = static::getAllCached();

        if (! isset($settings[$key])) {
            return $default;
        }

        return static::castValue($settings[$key]['value'], $settings[$key]['type']);
    }

    /**
     * Get all settings as a keyed collection from cache.
     * Returns: ['key' => ['value' => ..., 'type' => ..., ...], ...]
     */
    public static function getAllCached(): array
    {
        return Cache::remember(static::$cacheKey, static::$cacheTtl, function () {
            return static::all()
                ->keyBy('key')
                ->map(fn ($s) => [
                    'value'          => $s->value,
                    'type'           => $s->type,
                    'label_en'       => $s->label_en,
                    'label_ar'       => $s->label_ar,
                    'description_en' => $s->description_en,
                    'description_ar' => $s->description_ar,
                    'is_public'      => $s->is_public,
                ])
                ->toArray();
        });
    }

    /**
     * Update a setting by key, clear the cache.
     */
    public static function setValue(string $key, mixed $value): bool
    {
        $updated = static::where('key', $key)->update(['value' => (string) $value]);
        static::clearCache();
        return $updated > 0;
    }

    /**
     * Clear the settings cache (called after any update).
     */
    public static function clearCache(): void
    {
        Cache::forget(static::$cacheKey);
    }

    /**
     * Get all PUBLIC settings (safe to expose to frontend).
     */
    public static function getPublic(): array
    {
        return collect(static::getAllCached())
            ->filter(fn ($s) => $s['is_public'])
            ->map(fn ($s, $key) => [
                'key'   => $key,
                'value' => static::castValue($s['value'], $s['type']),
                'label_en' => $s['label_en'],
                'label_ar' => $s['label_ar'],
            ])
            ->values()
            ->toArray();
    }

    // ─── Value Casting ───────────────────────────────────────────

    public static function castValue(string $value, string $type): mixed
    {
        return match ($type) {
            'integer' => (int) $value,
            'decimal' => (float) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json'    => json_decode($value, true),
            default   => $value,
        };
    }
}
