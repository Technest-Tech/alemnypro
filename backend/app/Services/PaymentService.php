<?php

namespace App\Services;

use App\Models\BookingRequest;
use App\Models\Session;
use App\Models\WalletTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Mock Payment Service
 *
 * Simulates all payment operations without a real payment gateway.
 * When Paymob (or any gateway) is integrated, only this class changes.
 * All controllers and business logic stay exactly the same.
 */
class PaymentService
{
    public function __construct(
        private readonly WalletService $walletService
    ) {}

    // ─── Student Payment ──────────────────────────────────────────

    /**
     * Process payment for a booking (mock: instantly marks as paid).
     * In production: initiate Paymob payment link and redirect student.
     */
    public function processBookingPayment(BookingRequest $booking): array
    {
        if ($booking->isPaid()) {
            return ['success' => false, 'message' => 'Booking is already paid.'];
        }

        if ($booking->status !== 'accepted') {
            return ['success' => false, 'message' => 'Booking must be accepted before payment.'];
        }

        DB::transaction(function () use ($booking) {
            $perLesson   = (float) $booking->hourly_rate;
            $total       = round($perLesson * $booking->lessons_count, 2);

            $booking->update([
                'payment_status'    => 'paid',
                'paid_at'           => now(),
                'per_lesson_amount' => $perLesson,
                'total_amount'      => $total,
            ]);

            // Record a "hold" transaction on the student's ledger for traceability
            $this->walletService->hold(
                user: $booking->student,
                amount: 0, // mock: no real deduction from student wallet (gateway handles it)
                reference: $booking,
                descEn: "Payment for {$booking->lessons_count} lessons — {$booking->subject->name_en}",
                descAr: "دفع مقابل {$booking->lessons_count} حصص — {$booking->subject->name_ar}",
            );

            Log::info('[PaymentService:MOCK] Booking payment processed', [
                'booking_id' => $booking->id,
                'amount'     => $total,
            ]);
        });

        return ['success' => true, 'message' => 'Payment processed successfully.'];
    }

    // ─── Session Payout ───────────────────────────────────────────

    /**
     * Release payout to tutor wallet after a session is confirmed.
     * Called by AutoConfirmSessions cron or admin dispute resolution.
     */
    public function releaseSessionPayout(Session $session): bool
    {
        if ($session->isPayoutReleased()) {
            Log::warning('[PaymentService] Payout already released', ['session_id' => $session->id]);
            return false;
        }

        DB::transaction(function () use ($session) {
            $tutor = $session->tutor;

            $this->walletService->release(
                user: $tutor,
                amount: (float) $session->tutor_payout,
                reference: $session,
                descEn: "Payout for session #{$session->session_number} — {$session->subject->name_en}",
                descAr: "أرباح الحصة #{$session->session_number} — {$session->subject->name_ar}",
            );

            $session->update(['payout_released_at' => now()]);

            // Check if all sessions for this booking are now released
            $this->checkAndUpdateBookingPaymentStatus($session->booking);

            Log::info('[PaymentService] Payout released', [
                'session_id' => $session->id,
                'tutor_id'   => $tutor->id,
                'amount'     => $session->tutor_payout,
            ]);
        });

        return true;
    }

    // ─── Student Refund ───────────────────────────────────────────

    /**
     * Refund student when dispute is resolved in their favour.
     * Adds the lesson's gross_amount back to student wallet.
     */
    public function refundStudentForSession(Session $session): bool
    {
        DB::transaction(function () use ($session) {
            $student = $session->student;

            $this->walletService->refund(
                user: $student,
                amount: (float) $session->gross_amount,
                reference: $session,
                descEn: "Refund for disputed session #{$session->session_number} — {$session->subject->name_en}",
                descAr: "استرداد الحصة المتنازع عليها #{$session->session_number} — {$session->subject->name_ar}",
            );

            Log::info('[PaymentService] Refund issued', [
                'session_id' => $session->id,
                'student_id' => $student->id,
                'amount'     => $session->gross_amount,
            ]);
        });

        return true;
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private function checkAndUpdateBookingPaymentStatus(BookingRequest $booking): void
    {
        $total     = $booking->sessions()->count();
        $released  = $booking->sessions()->whereNotNull('payout_released_at')->count();

        if ($total > 0 && $released === $total) {
            $booking->update(['payment_status' => 'fully_released']);
        } elseif ($released > 0) {
            $booking->update(['payment_status' => 'partially_released']);
        }
    }
}
