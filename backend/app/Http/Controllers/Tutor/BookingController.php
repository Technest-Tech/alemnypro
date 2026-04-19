<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = BookingRequest::where('tutor_id', $request->user()->id)
            ->with(['student:id,name,avatar,phone', 'subject:id,name_ar,name_en'])
            ->when($request->filled('status'), fn ($q) => $q->byStatus($request->status))
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return $this->success($bookings);
    }

    public function accept(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::where('tutor_id', $request->user()->id)
            ->where('id', $id)
            ->pending()
            ->firstOrFail();

        $booking->update(['status' => 'accepted']);

        return $this->success($booking->fresh(['student', 'subject']), 'Booking accepted');
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::where('tutor_id', $request->user()->id)
            ->where('id', $id)
            ->pending()
            ->firstOrFail();

        $booking->update(['status' => 'rejected']);

        return $this->success(null, 'Booking rejected');
    }
}
