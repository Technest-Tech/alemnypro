<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VerificationDocument;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VerificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $docs = VerificationDocument::with(['tutorProfile.user:id,name,email,phone'])
            ->when($request->input('status', 'pending') !== 'all', function ($q) use ($request) {
                $q->where('status', $request->input('status', 'pending'));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $docs->getCollection()->transform(function ($doc) {
            $doc->file_url = url("/api/v1/admin/verifications/{$doc->id}/file");
            return $doc;
        });

        return $this->success($docs);
    }

    public function viewFile(int $id)
    {
        $doc = VerificationDocument::findOrFail($id);

        if (!Storage::disk('local')->exists($doc->file_path)) {
            abort(404, 'File not found');
        }

        return Storage::disk('local')->response($doc->file_path);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $doc = VerificationDocument::findOrFail($id);
        $doc->update([
            'status' => 'approved',
            'admin_notes' => $request->input('notes'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Check if all required docs are approved → verify tutor
        $profile = $doc->tutorProfile;
        $hasNationalId = $profile->verificationDocuments()->where('type', 'national_id')->where('status', 'approved')->exists();

        if ($hasNationalId) {
            $profile->update(['verification_status' => 'verified']);
        }

        return $this->success($doc->fresh(), 'Document approved');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $doc = VerificationDocument::findOrFail($id);
        $doc->update([
            'status' => 'rejected',
            'admin_notes' => $request->input('notes', 'Document rejected'),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return $this->success(null, 'Document rejected');
    }
}
