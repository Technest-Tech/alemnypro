<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Services\PaymentService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService  $paymentService,
        private readonly WhatsAppService $whatsApp
    ) {}

    // ─── POST /student/bookings/{id}/pay ─────────────────────────

    /**
     * Mock payment — instantly marks booking as paid.
     * Replace implementation with Paymob redirect when ready.
     */
    public function pay(Request $request, int $id): JsonResponse
    {
        $student = $request->user();
        $booking = BookingRequest::with(['tutor', 'subject', 'student'])
            ->where('student_id', $student->id)
            ->where('status', 'accepted')
            ->findOrFail($id);

        if ($booking->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been paid.',
            ], 422);
        }

        $result = $this->paymentService->processBookingPayment($booking);

        if (! $result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 422);
        }

        $booking->refresh();

        // WhatsApp notification to tutor — student has paid, schedule lessons now
        $tutor = $booking->tutor;
        if ($tutor && $tutor->phone) {
            $message = "💰 تم الدفع!\n\n"
                . "مرحباً {$tutor->name}،\n"
                . "أكمل الطالب *{$student->name}* دفع حجز *{$booking->subject->name_ar}*.\n\n"
                . "📦 *{$booking->lessons_count} حصص* — إجمالي: *{$booking->total_amount} EGP*\n\n"
                . "⏰ الرجاء جدولة الحصص من لوحة التحكم في أقرب وقت.\n\n"
                . "_فريق AlemnyPro_ 🎓";

            $this->whatsApp->send($tutor->phone, $message);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment successful! The tutor will schedule your lessons shortly.',
            'data'    => [
                'booking_id'     => $booking->id,
                'payment_status' => $booking->payment_status,
                'paid_at'        => $booking->paid_at,
                'total_amount'   => $booking->total_amount,
                'lessons_count'  => $booking->lessons_count,
            ],
        ]);
    }

    // ─── GET /student/bookings/{id}/payment-status ───────────────

    public function status(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::with(['sessions' => fn ($q) => $q->select('id', 'booking_request_id', 'status', 'payout_released_at')])
            ->where('student_id', $request->user()->id)
            ->select('id', 'lessons_count', 'total_amount', 'payment_status', 'paid_at', 'sessions_scheduled')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'booking_id'          => $booking->id,
                'payment_status'      => $booking->payment_status,
                'paid_at'             => $booking->paid_at,
                'total_amount'        => $booking->total_amount,
                'lessons_count'       => $booking->lessons_count,
                'sessions_scheduled'  => $booking->sessions_scheduled,
                'sessions_remaining'  => $booking->remainingSessions(),
            ],
        ]);
    }
}
