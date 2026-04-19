<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->tutorProfile()
            ->with(['governorate', 'city', 'neighborhood', 'subjects.category', 'verificationDocuments'])
            ->firstOrFail();

        return $this->success($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // Bio
            'headline_ar'           => ['sometimes', 'string', 'max:255'],
            'headline_en'           => ['sometimes', 'string', 'max:255'],
            'bio_ar'                => ['sometimes', 'string', 'max:3000'],
            'bio_en'                => ['sometimes', 'string', 'max:3000'],
            'bio_method_ar'         => ['sometimes', 'nullable', 'string', 'max:2000'],
            'bio_method_en'         => ['sometimes', 'nullable', 'string', 'max:2000'],
            // Experience / Education
            'experience_years'      => ['sometimes', 'nullable', 'integer', 'min:0', 'max:50'],
            'education'             => ['sometimes', 'nullable', 'string', 'max:500'],
            'education_level'       => ['sometimes', 'nullable', 'string', 'max:255'],
            // Pricing
            'hourly_rate'           => ['sometimes', 'numeric', 'min:0', 'max:99999'],
            'hourly_rate_online'    => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999'],
            'pack_5h_price'         => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999'],
            'pack_10h_price'        => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:999999'],
            'travel_expenses'       => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:99999'],
            'is_first_lesson_free'  => ['sometimes', 'boolean'],
            'first_lesson_duration' => ['sometimes', 'nullable', 'in:30,45,60,90'],
            // Format
            'lesson_format'         => ['sometimes', 'in:online,in_person,both'],
            // Location
            'governorate_id'        => ['sometimes', 'nullable', 'exists:governorates,id'],
            'city_id'               => ['sometimes', 'nullable', 'exists:cities,id'],
            'neighborhood_id'       => ['sometimes', 'nullable', 'exists:neighborhoods,id'],
            'location_label'        => ['sometimes', 'nullable', 'string', 'max:255'],
            // Video & Listing visibility
            'video_url'             => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_live'               => ['sometimes', 'boolean'],
        ]);

        $profile = $request->user()->tutorProfile;

        // experience_years is NOT NULL DEFAULT 0 — coerce null to 0
        if (array_key_exists('experience_years', $validated) && is_null($validated['experience_years'])) {
            $validated['experience_years'] = 0;
        }

        $profile->update($validated);

        return $this->success(
            $profile->fresh(['governorate', 'city', 'neighborhood']),
            'Profile updated successfully'
        );
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        // Store in storage/app/public/avatars and get the public URL
        $path     = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = Storage::disk('public')->url($path);

        // Save URL on the user record
        $user->update(['avatar' => $avatarUrl]);

        return $this->success(['avatar_url' => $avatarUrl], 'Avatar uploaded');
    }
}
