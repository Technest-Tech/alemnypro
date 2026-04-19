<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\GroupSession;
use App\Services\GroupSessionService;
use Illuminate\Http\Request;
use Exception;

class GroupSessionController extends Controller
{
    public function __construct(protected GroupSessionService $groupSessionService) {}

    public function index(Request $request)
    {
        $sessions = $request->user()->groupSessions()
            ->withCount('activeEnrollments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $sessions
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title_ar' => 'required|string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'lesson_format' => 'required|in:online,in_person',
            'pricing_model' => 'required|in:per_seat,monthly_subscription',
            'seat_price' => 'required|numeric|min:0',
            'max_capacity' => 'required|integer|min:2|max:100',
            'min_threshold' => 'required|integer|min:1|max:100',
            'is_first_session_free' => 'boolean',
            'session_date' => 'required|date',
            'session_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|integer|min:15|max:300',
        ]);

        if ($validated['min_threshold'] > $validated['max_capacity']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Minimum threshold cannot exceed max capacity.'
            ], 422);
        }

        $session = $this->groupSessionService->create($validated, $request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Group session created successfully',
            'data' => $session
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $session = $request->user()->groupSessions()
            ->with('enrollments.student.studentProfile')
            ->withCount('activeEnrollments')
            ->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $session
        ]);
    }

    public function update(Request $request, $id)
    {
        $session = $request->user()->groupSessions()->findOrFail($id);

        if ($session->status !== 'open' && $session->status !== 'draft') {
            return response()->json(['status' => 'error', 'message' => 'Cannot edit session after it is confirmed.'], 400);
        }

        $validated = $request->validate([
            'title_ar' => 'string|max:255',
            'title_en' => 'nullable|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
        ]);

        $session->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Group session updated successfully',
            'data' => $session
        ]);
    }

    public function confirm(Request $request, $id)
    {
        $session = $request->user()->groupSessions()->findOrFail($id);

        if ($session->status !== 'open') {
            return response()->json(['status' => 'error', 'message' => 'Session must be open to conform.'], 400);
        }

        $this->groupSessionService->confirmSession($session);

        return response()->json([
            'status' => 'success',
            'message' => 'Session confirmed successfully.'
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $session = $request->user()->groupSessions()->findOrFail($id);
        
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);

        try {
            $this->groupSessionService->cancelSession($session, $request->reason, $request->user());
            return response()->json([
                'status' => 'success',
                'message' => 'Session cancelled. Refunds and applicable penalties have been processed.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function complete(Request $request, $id)
    {
        $session = $request->user()->groupSessions()->findOrFail($id);
        
        if ($session->status !== 'confirmed') {
            return response()->json(['status' => 'error', 'message' => 'Session must be confirmed before it can be completed.'], 400);
        }

        $request->validate([
            'report' => 'required|string'
        ]);

        try {
            $this->groupSessionService->completeSession($session, $request->report);
            return response()->json([
                'status' => 'success',
                'message' => 'Session completed and funds released to your wallet.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
