<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    // ─── GET /admin/settings ─────────────────────────────────────

    public function index(): JsonResponse
    {
        $settings = PlatformSetting::all()->map(fn ($s) => [
            'id'             => $s->id,
            'key'            => $s->key,
            'value'          => PlatformSetting::castValue($s->value, $s->type),
            'type'           => $s->type,
            'label_en'       => $s->label_en,
            'label_ar'       => $s->label_ar,
            'description_en' => $s->description_en,
            'description_ar' => $s->description_ar,
            'is_public'      => $s->is_public,
            'updated_at'     => $s->updated_at,
        ]);

        return response()->json(['success' => true, 'data' => $settings]);
    }

    // ─── PUT /admin/settings/{key} ───────────────────────────────

    public function update(Request $request, string $key): JsonResponse
    {
        $setting = PlatformSetting::where('key', $key)->firstOrFail();

        $rules = match ($setting->type) {
            'integer' => ['value' => 'required|integer|min:0'],
            'decimal' => ['value' => 'required|numeric|min:0'],
            'boolean' => ['value' => 'required|boolean'],
            'json'    => ['value' => 'required|array'],
            default   => ['value' => 'required|string|max:500'],
        };

        // Special validations for known keys
        if ($key === 'platform_fee_pct') {
            $rules = ['value' => 'required|numeric|min:0|max:50'];
        }

        if ($key === 'dispute_window_hours') {
            $rules = ['value' => 'required|integer|min:1|max:168']; // max 7 days
        }

        $request->validate($rules);

        $newValue = $setting->type === 'json'
            ? json_encode($request->input('value'))
            : (string) $request->input('value');

        $setting->update(['value' => $newValue]);
        PlatformSetting::clearCache();

        return response()->json([
            'success' => true,
            'message' => "Setting '{$key}' updated successfully.",
            'data'    => [
                'key'   => $setting->key,
                'value' => PlatformSetting::castValue($setting->value, $setting->type),
            ],
        ]);
    }
}
