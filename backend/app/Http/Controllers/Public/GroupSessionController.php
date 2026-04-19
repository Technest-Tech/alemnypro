<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\GroupSession;
use Illuminate\Http\Request;

class GroupSessionController extends Controller
{
    public function index(Request $request)
    {
        // Public API filters
        $query = GroupSession::with(['tutor.tutorProfile', 'subject', 'activeEnrollments'])
            ->whereIn('status', ['open', 'confirmed'])
            ->upcoming();

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        // We paginate for real public browsing
        $sessions = $query->paginate(15);

        // We append a custom attribute `enrollment_count` to avoid frontends computing it themselves, but since `withCount` is easier:
        // Actually, we should just use withCount
        $sessionsQuery = GroupSession::with(['tutor.tutorProfile', 'subject'])
            ->withCount('activeEnrollments')
            ->whereIn('status', ['open', 'confirmed'])
            ->upcoming();
            
        if ($request->filled('subject_id')) {
            $sessionsQuery->where('subject_id', $request->subject_id);
        }
            
        $sessionsPaginated = $sessionsQuery->paginate(12);

        return response()->json([
            'status' => 'success',
            'data' => $sessionsPaginated
        ]);
    }

    public function show($id)
    {
        $session = GroupSession::with(['tutor.tutorProfile', 'subject'])
            ->withCount('activeEnrollments')
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $session
        ]);
    }
}
