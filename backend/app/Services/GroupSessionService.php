<?php

namespace App\Services;

use App\Models\GroupSession;
use App\Models\GroupEnrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class GroupSessionService
{
    public function __construct(protected WalletService $walletService) {}

    /**
     * Validate and create a group session for a tutor.
     */
    public function create(array $data, User $tutor): GroupSession
    {
        $data['tutor_id'] = $tutor->id;
        $data['status'] = 'open'; // Auto-open for MVP

        return GroupSession::create($data);
    }

    /**
     * Enroll a student, check capacity atomically, and hold funds.
     */
    public function enrollStudent(GroupSession $session, User $student): GroupEnrollment
    {
        return DB::transaction(function () use ($session, $student) {
            // Retrieve session with a lock
            $lockedSession = GroupSession::lockForUpdate()->find($session->id);

            if ($lockedSession->isFull()) {
                throw new Exception('This session is fully booked.');
            }

            if ($lockedSession->status !== 'open' && $lockedSession->status !== 'confirmed') {
                throw new Exception('This session is not open for enrollment.');
            }

            // Check if already enrolled
            $existing = GroupEnrollment::where('group_session_id', $lockedSession->id)
                ->where('student_id', $student->id)
                ->first();

            if ($existing) {
                if ($existing->status === 'enrolled') {
                    throw new Exception('Student is already enrolled.');
                }
            }

            $priceToPay = $lockedSession->seat_price;
            if ($lockedSession->is_first_session_free) {
                // Determine if this is actually the first session for this student in this subject maybe
                // For MVP, just assume the price is 0 if is_first_session_free flag is active
                $priceToPay = 0;
            }

            // Create enrollment
            $enrollment = GroupEnrollment::create([
                'group_session_id' => $lockedSession->id,
                'student_id'       => $student->id,
                'amount_paid'      => $priceToPay,
                'payment_status'   => 'held',
                'status'           => 'enrolled',
            ]);

            // Hold funds
            if ($priceToPay > 0) {
                $this->walletService->hold(
                    $student, 
                    $priceToPay, 
                    $enrollment, 
                    "Seat reservation hold for: " . $lockedSession->title_en,
                    "احتجاز مبلغ حجز المقعد: " . $lockedSession->title_ar
                );
            } else {
                $enrollment->update(['payment_status' => 'released']); // Free session, nothing to hold
            }

            return $enrollment;
        });
    }

    /**
     * Evaluate threshold limits via cron job.
     */
    public function checkThreshold(GroupSession $session): void
    {
        if ($session->isThresholdMet()) {
            $this->confirmSession($session);
        } else {
            // Set a flag or notify tutor to confirm/cancel
            $session->update(['threshold_checked_at' => now()]);
            // TODO: In real app, dispatch notification to tutor
        }
    }

    /**
     * Mark session confirmed. Notify everyone.
     */
    public function confirmSession(GroupSession $session): void
    {
        $session->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);
        
        // TODO: Notification to all enrolled students
    }

    /**
     * Tutor forcibly cancels the session. Distribute refunds and apply penalties if needed.
     */
    public function cancelSession(GroupSession $session, string $reason, User $tutor): void
    {
        DB::transaction(function () use ($session, $reason, $tutor) {
            if ($session->tutor_id !== $tutor->id && !$tutor->isAdmin()) {
                throw new Exception('Unauthorized to cancel this session.');
            }

            $applyPenalty = false;
            // Only penalize if confirmed
            if ($session->status === 'confirmed') {
                $applyPenalty = true;
            }

            $session->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => $reason
            ]);

            $activeEnrollments = $session->activeEnrollments()->get();
            $totalRevenue = 0;

            foreach ($activeEnrollments as $enrollment) {
                if ($enrollment->payment_status === 'held') {
                    $totalRevenue += $enrollment->amount_paid;
                    
                    // Refund to student
                    $this->walletService->refund(
                        $enrollment->student,
                        $enrollment->amount_paid,
                        $enrollment,
                        "Refund for cancelled session: " . $session->title_en,
                        "استرداد مبلغ لقاء ملغى: " . $session->title_ar
                    );

                    $enrollment->update([
                        'status' => 'cancelled',
                        'cancelled_at' => now(),
                        'payment_status' => 'refunded'
                    ]);
                }
            }

            if ($applyPenalty && $totalRevenue > 0) {
                // 25% penalty
                $penaltyAmount = $totalRevenue * 0.25;
                $this->walletService->applyPenalty(
                    $tutor,
                    $penaltyAmount,
                    $session,
                    "Cancellation penalty for: " . $session->title_en,
                    "غرامة إلغاء جلسة: " . $session->title_ar
                );
            }
        });
    }

    /**
     * Session is finished. Pay the tutor their share.
     */
    public function completeSession(GroupSession $session, string $report): void
    {
        DB::transaction(function () use ($session, $report) {
            $session->update([
                'status' => 'completed',
                'tutor_report' => $report,
            ]);

            $activeEnrollments = $session->activeEnrollments()->get();
            $tutorEarnings = 0;
            $platformCommissionRate = 0.15; // 15%

            foreach ($activeEnrollments as $enrollment) {
                if ($enrollment->payment_status === 'held') {
                    $seatRevenue = $enrollment->amount_paid;
                    $platformFee = $seatRevenue * $platformCommissionRate;
                    $tutorShare = $seatRevenue - $platformFee;

                    $tutorEarnings += $tutorShare;

                    $enrollment->update([
                        'payment_status' => 'released'
                    ]);
                }
            }

            if ($tutorEarnings > 0) {
                $this->walletService->release(
                    $session->tutor,
                    $tutorEarnings,
                    $session,
                    "Earnings transferred for completing session: " . $session->title_en,
                    "أرباح جلسة: " . $session->title_ar
                );
            }
        });
    }
}
