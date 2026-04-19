<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\TutorAvailability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $slots = $request->user()->tutorProfile
            ->availabilities()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return $this->success($slots);
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots' => ['required', 'array'],
            'slots.*.day_of_week' => ['required', 'integer', 'between:0,6'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time' => ['required', 'date_format:H:i', 'after:slots.*.start_time'],
            'slots.*.is_active' => ['sometimes', 'boolean'],
        ]);

        $profile = $request->user()->tutorProfile;

        // Delete existing and recreate
        $profile->availabilities()->delete();

        $slots = collect($validated['slots'])->map(fn ($slot) => [
            'tutor_profile_id' => $profile->id,
            'day_of_week' => $slot['day_of_week'],
            'start_time' => $slot['start_time'],
            'end_time' => $slot['end_time'],
            'is_active' => $slot['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        TutorAvailability::insert($slots);

        return $this->success(
            $profile->availabilities()->orderBy('day_of_week')->get(),
            'Availability updated'
        );
    }
}
