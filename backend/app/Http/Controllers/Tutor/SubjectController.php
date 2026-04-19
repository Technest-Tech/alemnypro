<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\TutorSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $subjects = $request->user()->tutorProfile
            ->tutorSubjects()
            ->with('subject.category')
            ->get();

        return $this->success($subjects);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_id'  => ['required', 'exists:subjects,id'],
            'levels'      => ['sometimes', 'array'],
            'levels.*'    => ['string', 'max:100'],
            'hourly_rate' => ['sometimes', 'numeric', 'min:50', 'max:5000'],
        ]);

        $profile = $request->user()->tutorProfile;

        $exists = TutorSubject::where('tutor_profile_id', $profile->id)
            ->where('subject_id', $validated['subject_id'])
            ->exists();

        if ($exists) {
            return $this->error('Subject already added', 422);
        }

        $tutorSubject = TutorSubject::create([
            'tutor_profile_id' => $profile->id,
            'subject_id'       => $validated['subject_id'],
            'levels'           => $validated['levels'] ?? null,
            'hourly_rate'      => $validated['hourly_rate'] ?? null,
        ]);

        return $this->created($tutorSubject->load('subject'), 'Subject added');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'levels'      => ['sometimes', 'array'],
            'levels.*'    => ['string', 'max:100'],
            'hourly_rate' => ['sometimes', 'numeric', 'min:50', 'max:5000'],
        ]);

        $tutorSubject = $request->user()->tutorProfile
            ->tutorSubjects()
            ->where('id', $id)
            ->first();

        if (!$tutorSubject) {
            return $this->notFound('Subject not found');
        }

        $tutorSubject->update($validated);

        return $this->success($tutorSubject->load('subject'), 'Subject updated');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $deleted = $request->user()->tutorProfile
            ->tutorSubjects()
            ->where('id', $id)
            ->delete();

        if (!$deleted) {
            return $this->notFound('Subject not found');
        }

        return $this->success(null, 'Subject removed');
    }
}

