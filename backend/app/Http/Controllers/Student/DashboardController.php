<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        return $this->success([
            'pending_bookings' => BookingRequest::where('student_id', $userId)->pending()->count(),
            'active_bookings' => BookingRequest::where('student_id', $userId)->byStatus('accepted')->count(),
            'completed_bookings' => BookingRequest::where('student_id', $userId)->byStatus('completed')->count(),
            'total_bookings' => BookingRequest::where('student_id', $userId)->count(),
        ]);
    }
}
