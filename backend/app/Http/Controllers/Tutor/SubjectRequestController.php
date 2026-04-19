<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\SubjectRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject_name'        => ['required', 'string', 'min:2', 'max:100'],
            'category_suggestion' => ['nullable', 'string', 'max:100'],
        ]);

        $existing = SubjectRequest::where('user_id', $request->user()->id)
            ->where('subject_name', $validated['subject_name'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return $this->error('You have already requested this subject.', 422);
        }

        $subjectRequest = SubjectRequest::create([
            'user_id'             => $request->user()->id,
            'subject_name'        => $validated['subject_name'],
            'category_suggestion' => $validated['category_suggestion'] ?? null,
            'status'              => 'pending',
        ]);

        return $this->created($subjectRequest, 'Subject request submitted. Our team will review it within 48 hours.');
    }

    public function index(Request $request): JsonResponse
    {
        $requests = SubjectRequest::byUser($request->user()->id)
            ->with('createdSubject')
            ->latest()
            ->get();

        return $this->success($requests);
    }
}
