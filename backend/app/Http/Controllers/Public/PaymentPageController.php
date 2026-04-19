<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\ConversationMessage;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentPageController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    private function frontendUrl(string $path): string
    {
        return config('app.frontend_url', 'http://localhost:3000') . $path;
    }

    // ─── GET /public/payment/{token} ─────────────────────────────
    /**
     * Get payment page details by unique token.
     * No authentication required — public page.
     */
    public function show(string $token): JsonResponse
    {
        $booking = BookingRequest::where('payment_token', $token)
            ->with([
                'tutor:id,name,avatar,phone',
                'tutor.tutorProfile:user_id,headline_ar,headline_en,avg_rating,total_reviews',
                'student:id,name',
                'subject:id,name_ar,name_en',
            ])
            ->firstOrFail();

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'success' => true,
                'data'    => [
                    'already_paid' => true,
                    'booking_id'   => $booking->id,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'already_paid'      => false,
                'booking_id'        => $booking->id,
                'tutor'             => $booking->tutor,
                'tutor_headline'    => $booking->tutor->tutorProfile?->headline_ar ?? $booking->tutor->tutorProfile?->headline_en,
                'student'           => $booking->student,
                'subject_name_ar'   => $booking->subject->name_ar,
                'subject_name_en'   => $booking->subject->name_en,
                'lessons_count'     => $booking->lessons_count,
                'per_lesson_amount' => $booking->per_lesson_amount,
                'total_amount'      => $booking->total_amount,
                'lesson_format'     => $booking->lesson_format,
                'confirmed_date'    => $booking->confirmed_date,
                'confirmed_time'    => $booking->confirmed_time,
                'payment_status'    => $booking->payment_status,
            ],
        ]);
    }

    // ─── POST /public/payment/{token}/pay ────────────────────────
    /**
     * Process payment for a booking using the public token.
     * Currently mock — marks booking as paid.
     */
    public function pay(Request $request, string $token): JsonResponse
    {
        $request->validate([
            'method' => ['required', 'in:credit_card,vodafone_cash,instapay,wallet'],
        ]);

        $booking = BookingRequest::where('payment_token', $token)
            ->where('status', 'accepted')
            ->with(['tutor', 'student', 'subject'])
            ->firstOrFail();

        if ($booking->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been paid.',
            ], 422);
        }

        $total = (float) $booking->total_amount;

        DB::transaction(function () use ($booking, $request, $total) {
            $booking->update([
                'payment_status' => 'paid',
                'paid_at'        => now(),
            ]);

            // Create payment_completed message in conversation
            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $booking->student_id,
                'type'               => 'payment_completed',
                'body'               => null,
                'metadata'           => [
                    'amount'        => $total,
                    'method'        => $request->method,
                    'lessons_count' => $booking->lessons_count,
                    'paid_at'       => now()->toIso8601String(),
                ],
            ]);
        });

        $booking->touch();

        // WhatsApp notification to tutor
        $tutor   = $booking->tutor;
        $student = $booking->student;

        if ($tutor?->phone) {
            $this->whatsApp->notifyTutorPaymentReceived(
                tutorPhone  : $tutor->phone,
                tutorName   : $tutor->name,
                studentName : $student->name,
                subjectName : $booking->subject->name_ar ?? $booking->subject->name_en,
                totalAmount : $total,
                lessonsCount: $booking->lessons_count,
                dashboardUrl: $this->frontendUrl('/dashboard/tutor/messages')
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم الدفع بنجاح! سيتواصل معك المدرس لجدولة الحصص.',
            'data'    => [
                'booking_id'     => $booking->id,
                'payment_status' => 'paid',
                'total_amount'   => $total,
                'lessons_count'  => $booking->lessons_count,
            ],
        ]);
    }
}
