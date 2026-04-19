<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\TutorDocument;
use App\Models\TutorSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class OnboardingController extends Controller
{
    // ─── GET /tutor/onboarding/status ───────────────────────────────────────

    public function getStatus(Request $request): JsonResponse
    {
        $profile = $request->user()->tutorProfile;

        if (!$profile) {
            return $this->error('Tutor profile not found', 404);
        }

        $subjects = $profile->tutorSubjects()->with('subject.category')->get();
        $documents = $profile->documents()->get(['type', 'status', 'original_filename']);

        $completedSteps = $this->getCompletedSteps($profile, $subjects, $documents);

        return $this->success([
            'current_step'    => $profile->onboarding_step,
            'onboarding_status' => $profile->onboarding_status,
            'rejection_reason'  => $profile->rejection_reason,
            'completed_steps'   => $completedSteps,
            'profile'           => $profile->only([
                'headline_ar', 'headline_en', 'bio_ar', 'bio_en',
                'bio_method_ar', 'bio_method_en',
                'hourly_rate', 'hourly_rate_online',
                'pack_5h_price', 'pack_10h_price', 'travel_expenses',
                'lesson_format', 'lesson_format_details',
                'group_pricing', 'is_first_lesson_free', 'first_lesson_duration',
                'is_first_trial_free', 'trial_duration_minutes',
                'experience_years', 'education_level', 'video_url',
                'governorate_id', 'city_id',
            ]),
            'subjects'    => $subjects,
            'documents'   => $documents,
        ]);
    }

    // ─── PATCH /tutor/onboarding/step-1 ─────────────────────────────────────
    // Subjects (up to 4), each with levels[] and hourly_rate

    public function saveStep1(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subjects'              => ['required', 'array', 'min:1', 'max:4'],
            'subjects.*.subject_id' => ['required', 'exists:subjects,id'],
            'subjects.*.levels'     => ['required', 'array', 'min:1'],
            'subjects.*.levels.*'   => ['required', 'string', Rule::in([
                'primary', 'preparatory', 'secondary', 'university', 'adults'
            ])],
            'subjects.*.hourly_rate' => ['nullable', 'numeric', 'min:50', 'max:5000'],
            'experience_years'       => ['nullable', 'integer', 'min:0', 'max:60'],
            'education_level'        => ['nullable', 'string', Rule::in([
                'high_school', 'bachelors', 'masters', 'phd', 'professional'
            ])],
        ]);

        $profile = $request->user()->tutorProfile;

        // Remove existing subjects and re-sync
        TutorSubject::where('tutor_profile_id', $profile->id)->delete();

        foreach ($validated['subjects'] as $item) {
            TutorSubject::create([
                'tutor_profile_id' => $profile->id,
                'subject_id'       => $item['subject_id'],
                'proficiency_level'=> 'intermediate',
                'levels'           => $item['levels'],
                'hourly_rate'      => $item['hourly_rate'] ?? $profile->hourly_rate ?? 150,
            ]);
        }

        // Save experience & education to profile
        $profile->update([
            'experience_years' => $validated['experience_years'] ?? $profile->experience_years,
            'education_level'  => $validated['education_level'] ?? $profile->education_level,
        ]);

        $this->advanceStep($profile, 1);

        return $this->success([
            'subjects' => $profile->tutorSubjects()->with('subject.category')->get(),
        ], 'Subjects saved');
    }

    // ─── PATCH /tutor/onboarding/step-2 ─────────────────────────────────────
    // Professional Pitch — Headline + Bio

    public function saveStep2(Request $request): JsonResponse
    {
        $request->validate([
            'headline_ar'    => ['nullable', 'string', 'max:80'],
            'headline_en'    => ['nullable', 'string', 'max:80'],
            'bio_ar'         => ['nullable', 'string', 'min:30'],
            'bio_en'         => ['nullable', 'string', 'min:30'],
            'bio_method_ar'  => ['nullable', 'string'],
            'bio_method_en'  => ['nullable', 'string'],
            'video_url'      => ['nullable', 'url'],
        ]);

        // At least one headline is required
        if (!$request->input('headline_ar') && !$request->input('headline_en')) {
            return $this->error('At least one headline (Arabic or English) is required', 422);
        }

        $profile = $request->user()->tutorProfile;

        $profile->update([
            'headline_ar'   => $request->input('headline_ar'),
            'headline_en'   => $request->input('headline_en'),
            'bio_ar'        => $request->input('bio_ar'),
            'bio_en'        => $request->input('bio_en'),
            'bio_method_ar' => $request->input('bio_method_ar'),
            'bio_method_en' => $request->input('bio_method_en'),
            'video_url'     => $request->input('video_url'),
        ]);

        $this->advanceStep($profile, 2);

        return $this->success(null, 'Professional profile saved');
    }

    // ─── PATCH /tutor/onboarding/step-3 ─────────────────────────────────────
    // Format & Location

    public function saveStep3(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'formats'             => ['required', 'array', 'min:1'],
            'formats.*'           => ['required', 'string', Rule::in(['online', 'my_place', 'student_place'])],
            'travel_radius_km'    => ['nullable', 'integer', 'min:1', 'max:50'],
            'location_lat'        => ['nullable', 'numeric'],
            'location_lng'        => ['nullable', 'numeric'],
            'location_label'      => ['nullable', 'string', 'max:255'],
            'governorate_id'      => ['nullable', 'exists:governorates,id'],
            'city_id'             => ['nullable', 'exists:cities,id'],
        ]);

        $profile = $request->user()->tutorProfile;

        // Determine primary lesson_format value for backwards compatibility
        $formats = $validated['formats'];
        $format  = 'both';
        if (count($formats) === 1) {
            $format = $formats[0] === 'online' ? 'online' : 'in_person';
        }

        $profile->update([
            'lesson_format'         => $format,
            'lesson_format_details' => [
                'formats'          => $formats,
                'travel_radius_km' => $validated['travel_radius_km'] ?? null,
                'location_lat'     => $validated['location_lat'] ?? null,
                'location_lng'     => $validated['location_lng'] ?? null,
                'location_label'   => $validated['location_label'] ?? null,
            ],
            'governorate_id' => $validated['governorate_id'] ?? null,
            'city_id'        => $validated['city_id'] ?? null,
        ]);

        $this->advanceStep($profile, 3);

        return $this->success(null, 'Format & location saved');
    }

    // ─── PATCH /tutor/onboarding/step-4 ─────────────────────────────────────
    // Pricing & Smart Groups

    public function saveStep4(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'hourly_rate'             => ['required', 'numeric', 'min:50', 'max:5000'],
            'hourly_rate_online'      => ['nullable', 'numeric', 'min:50', 'max:5000'],
            'pack_5h_price'           => ['nullable', 'numeric', 'min:0'],
            'pack_10h_price'          => ['nullable', 'numeric', 'min:0'],
            'travel_expenses'         => ['nullable', 'numeric', 'min:0'],
            'is_first_lesson_free'    => ['sometimes', 'boolean'],
            'first_lesson_duration'   => ['sometimes', 'integer', Rule::in([30, 45, 60, 90])],
            'group_sessions_enabled'  => ['sometimes', 'boolean'],
            'group_price_per_seat'    => ['nullable', 'numeric', 'min:20', 'max:2000'],
            'group_max_capacity'      => ['nullable', 'integer', 'min:2', 'max:30'],
            'group_min_threshold'     => ['nullable', 'integer', 'min:2'],
        ]);

        $profile = $request->user()->tutorProfile;

        $groupEnabled = $validated['group_sessions_enabled'] ?? false;
        $groupPricing = null;

        if ($groupEnabled) {
            $request->validate([
                'group_price_per_seat' => ['required'],
                'group_max_capacity'   => ['required'],
                'group_min_threshold'  => ['required', 'lte:group_max_capacity'],
            ]);
            $groupPricing = [
                'enabled'       => true,
                'price_per_seat'=> $validated['group_price_per_seat'],
                'max_capacity'  => $validated['group_max_capacity'],
                'min_threshold' => $validated['group_min_threshold'],
            ];
        }

        $profile->update([
            'hourly_rate'            => $validated['hourly_rate'],
            'hourly_rate_online'     => $validated['hourly_rate_online'] ?? null,
            'pack_5h_price'          => $validated['pack_5h_price'] ?? null,
            'pack_10h_price'         => $validated['pack_10h_price'] ?? null,
            'travel_expenses'        => $validated['travel_expenses'] ?? null,
            'group_pricing'          => $groupPricing,
            'is_first_lesson_free'   => $validated['is_first_lesson_free'] ?? false,
            'is_first_trial_free'    => $validated['is_first_lesson_free'] ?? false,
            'first_lesson_duration'  => $validated['first_lesson_duration'] ?? 60,
            'trial_duration_minutes' => $validated['first_lesson_duration'] ?? 60,
        ]);

        $this->advanceStep($profile, 4);

        return $this->success(null, 'Pricing saved');
    }

    // ─── PATCH /tutor/onboarding/step-5 ─────────────────────────────────────
    // Document Uploads (multipart/form-data)

    public function saveStep5(Request $request): JsonResponse
    {
        $profile = $request->user()->tutorProfile;

        $alreadyHas = fn(string $type) => \App\Models\TutorDocument::where('tutor_profile_id', $profile->id)
            ->where('type', $type)
            ->exists();

        $request->validate([
            'national_id_front' => [$alreadyHas('national_id_front') ? 'nullable' : 'required', 'file', 'mimes:jpeg,png,pdf', 'max:5120'],
            'national_id_back'  => [$alreadyHas('national_id_back')  ? 'nullable' : 'required', 'file', 'mimes:jpeg,png,pdf', 'max:5120'],
            'criminal_record'   => [$alreadyHas('criminal_record')   ? 'nullable' : 'required', 'file', 'mimes:jpeg,png,pdf', 'max:5120'],
            'university_degree' => ['nullable', 'file', 'mimes:jpeg,png,pdf', 'max:5120'],
        ]);

        $docTypes = [
            'national_id_front' => 'national_id_front',
            'national_id_back'  => 'national_id_back',
            'criminal_record'   => 'criminal_record',
            'university_degree' => 'university_degree',
        ];

        $saved = [];
        foreach ($docTypes as $field => $type) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);

                // Store in private local disk
                $path = $file->store("tutor-documents/{$profile->id}", 'local');

                // Replace existing document of this type
                TutorDocument::where('tutor_profile_id', $profile->id)
                    ->where('type', $type)
                    ->each(function (TutorDocument $doc) {
                        Storage::disk('local')->delete($doc->file_path);
                        $doc->delete();
                    });

                $doc = TutorDocument::create([
                    'tutor_profile_id' => $profile->id,
                    'type'             => $type,
                    'file_path'        => $path,
                    'original_filename'=> $file->getClientOriginalName(),
                    'mime_type'        => $file->getMimeType(),
                    'file_size'        => $file->getSize(),
                    'status'           => 'pending',
                ]);

                $saved[] = $doc->only(['id', 'type', 'original_filename', 'status']);
            }
        }

        $this->advanceStep($profile, 5);

        return $this->success(['documents' => $saved], 'Documents uploaded');
    }

    // ─── PATCH /tutor/onboarding/step-6 ─────────────────────────────────────
    // Availability (weekly calendar)

    public function saveStep6(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots'             => ['required', 'array', 'min:3'],
            'slots.*.day'       => ['required', 'string', Rule::in([
                'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
            ])],
            'slots.*.start_time'    => ['required', 'date_format:H:i'],
            'slots.*.end_time'      => ['required', 'date_format:H:i', 'after:slots.*.start_time'],
            'slots.*.is_recurring'  => ['sometimes', 'boolean'],
        ]);

        $profile = $request->user()->tutorProfile;

        // Sync availability
        $profile->availabilities()->delete();
        foreach ($validated['slots'] as $slot) {
            $profile->availabilities()->create([
                'day_of_week'  => $slot['day'],
                'start_time'   => $slot['start_time'],
                'end_time'     => $slot['end_time'],
                'is_recurring' => $slot['is_recurring'] ?? true,
            ]);
        }

        $this->advanceStep($profile, 6);

        return $this->success(null, 'Availability saved');
    }

    // ─── POST /tutor/onboarding/submit ──────────────────────────────────────

    public function submit(Request $request): JsonResponse
    {
        $profile  = $request->user()->tutorProfile;
        $subjects = $profile->tutorSubjects()->count();
        $docs     = $profile->documents()->whereIn('type', ['national_id_front', 'national_id_back', 'criminal_record'])->count();

        $errors = [];

        if ($subjects < 1)          $errors[] = 'At least one subject is required';
        if (!$profile->headline_ar && !$profile->headline_en) $errors[] = 'Headline is required (Arabic or English)';
        if (!$profile->hourly_rate && !$profile->hourly_rate_online) $errors[] = 'At least one hourly rate is required';
        if ($docs < 3)              $errors[] = 'Required documents are missing';
        if ($profile->availabilities()->count() < 3) $errors[] = 'At least 3 availability slots required';

        if (!empty($errors)) {
            return $this->error(implode(', ', $errors), 422);
        }

        $profile->update([
            'onboarding_status' => 'pending_review',
            'onboarding_step'   => 7,
        ]);

        return $this->success([
            'status' => 'pending_review',
        ], 'Profile submitted for review! We will review it within 24-48 hours.');
    }

    // ─── Private Helpers ────────────────────────────────────────────────────

    private function advanceStep($profile, int $step): void
    {
        if ($profile->onboarding_step <= $step) {
            $profile->update(['onboarding_step' => $step + 1]);
        }
    }

    private function getCompletedSteps($profile, $subjects, $documents): array
    {
        $completed = [];

        // Step 0: Account created (always done if profile exists)
        $completed[0] = true;

        // Step 1: Subjects + Experience
        $completed[1] = $subjects->count() >= 1;

        // Step 2: Professional profile (bilingual)
        $completed[2] = ($profile->headline_ar || $profile->headline_en);

        // Step 3: Format
        $completed[3] = !empty($profile->lesson_format_details);

        // Step 4: Pricing
        $completed[4] = (float) $profile->hourly_rate > 0 || (float) $profile->hourly_rate_online > 0;

        // Step 5: Documents (need at least 2 required docs)
        $requiredDocTypes = ['national_id_front', 'national_id_back', 'criminal_record'];
        $uploadedTypes = $documents->pluck('type')->toArray();
        $completed[5] = count(array_intersect($requiredDocTypes, $uploadedTypes)) >= 3;

        // Step 6: Availability
        $completed[6] = $profile->availabilities()->count() >= 3;

        return $completed;
    }
}
