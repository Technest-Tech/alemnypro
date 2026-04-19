<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:national_id,criminal_record,certificate'],
            'file' => ['required', 'file', 'mimes:pdf,jpeg,png,webp', 'max:5120'],
        ]);

        $profile = $request->user()->tutorProfile;
        $path = $request->file('file')->store("verifications/{$profile->id}", 'local');

        $doc = $profile->verificationDocuments()->create([
            'type' => $validated['type'],
            'file_path' => $path,
            'status' => 'pending',
        ]);

        return $this->created($doc, 'Document uploaded for review');
    }

    public function status(Request $request): JsonResponse
    {
        $docs = $request->user()->tutorProfile
            ->verificationDocuments()
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($docs);
    }
}
