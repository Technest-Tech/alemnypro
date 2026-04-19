<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TutorProfile;
use App\Models\BookingRequest;
use App\Models\Session;
use App\Models\SessionDispute;
use App\Models\VerificationDocument;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class SessionsAndStudentsSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Grab admin user for dispute resolution ─────────────────
        $admin = User::where('role', 'admin')->first();

        // ── 2. Create Students ───────────────────────────────────────
        $studentDefs = [
            ['name' => 'ليلى حسن محمود',    'email' => 'layla.student@alemnypro.com',   'phone' => '01501234567'],
            ['name' => 'يوسف إبراهيم كمال',  'email' => 'youssef.student@alemnypro.com',  'phone' => '01612345678'],
            ['name' => 'مروة سامي الشرقاوي', 'email' => 'marwa.student@alemnypro.com',    'phone' => '01723456789'],
            ['name' => 'كريم أحمد فريد',     'email' => 'karim.student@alemnypro.com',    'phone' => '01834567890'],
            ['name' => 'دانا خالد سليم',     'email' => 'dana.student@alemnypro.com',     'phone' => '01945678901'],
        ];

        $studentUsers = [];
        foreach ($studentDefs as $s) {
            $user = User::firstOrCreate(
                ['email' => $s['email']],
                [
                    'name'      => $s['name'],
                    'phone'     => $s['phone'],
                    'password'  => Hash::make('password'),
                    'role'      => 'student',
                    'locale'    => 'ar',
                    'is_active' => true,
                ]
            );
            if (! $user->hasRole('student')) {
                $user->assignRole('student');
            }
            $studentUsers[] = $user;
        }

        // ── 3. Grab verified tutors ──────────────────────────────────
        $tutors = User::where('role', 'tutor')
            ->whereHas('tutorProfile', fn($q) => $q->where('verification_status', 'verified'))
            ->with('tutorProfile')
            ->get();

        if ($tutors->isEmpty()) {
            $this->command->warn('No verified tutors found — run TutorSeeder first.');
            return;
        }

        // ── 4. Add pending verification docs for queue ───────────────
        foreach ($tutors->take(3) as $tutor) {
            $profile = $tutor->tutorProfile;
            if (! $profile) continue;

            $exists = VerificationDocument::where('tutor_profile_id', $profile->id)->exists();
            if (! $exists) {
                VerificationDocument::create([
                    'tutor_profile_id' => $profile->id,
                    'type'             => 'national_id',
                    'file_path'        => 'docs/national-id-' . $profile->id . '.jpg',
                    'status'           => 'pending',
                ]);
            }
        }

        // ── 5. Look up subjects ──────────────────────────────────────
        $subjects  = DB::table('subjects')->pluck('id')->toArray();
        $mathId    = DB::table('subjects')->where('slug', 'mathematics')->value('id') ?? $subjects[0];
        $engId     = DB::table('subjects')->where('slug', 'english')->value('id')     ?? ($subjects[1] ?? $mathId);
        $physId    = DB::table('subjects')->where('slug', 'physics')->value('id')     ?? ($subjects[2] ?? $mathId);
        $pyId      = DB::table('subjects')->where('slug', 'python')->value('id')      ?? ($subjects[3] ?? $mathId);

        $subjectCycle = [$mathId, $engId, $physId, $pyId, $mathId, $engId, $physId, $pyId,
                         $mathId, $engId, $physId, $pyId, $mathId, $engId, $physId, $pyId,
                         $mathId, $engId, $physId, $pyId];

        $now = Carbon::now();

        // ── 6. Session scenarios ─────────────────────────────────────
        // [desiredStatus, daysOffset, gross, disputeStatus|null]
        $scenarios = [
            ['confirmed',  -20, 500, null],
            ['confirmed',  -18, 300, null],
            ['confirmed',  -15, 400, null],
            ['confirmed',  -14, 300, null],
            ['confirmed',  -10, 250, null],
            ['confirmed',   -7, 400, null],
            ['confirmed',   -5, 300, null],
            ['confirmed',   -3, 250, null],
            ['confirmed',   -2, 350, null],
            ['confirmed',   -1, 300, null],
            ['completed',   -2, 250, null],
            ['completed',   -1, 400, null],
            ['disputed',    -5, 300, 'open'],
            ['disputed',    -7, 250, 'open'],
            ['disputed',    -9, 350, 'resolved_tutor'],
            ['disputed',   -12, 300, 'resolved_student'],
            ['scheduled',    1, 300, null],
            ['scheduled',    2, 400, null],
            ['scheduled',    3, 250, null],
            ['scheduled',    5, 350, null],
        ];

        foreach ($scenarios as $i => [$desiredStatus, $daysOffset, $gross, $disputeStatus]) {
            $tutor     = $tutors[$i % $tutors->count()];
            $student   = $studentUsers[$i % count($studentUsers)];
            $subjectId = $subjectCycle[$i];

            $feePct      = 15.0;
            $platformFee = round($gross * $feePct / 100, 2);
            $tutorPayout = round($gross - $platformFee, 2);

            $scheduledAt      = $now->copy()->addDays($daysOffset)->setTime(10 + ($i % 8), 0, 0);
            $completedAt      = null;
            $confirmedAt      = null;
            $disputeWindowEnd = null;
            $payoutAt         = null;
            $cancelledReason  = null;
            $sessionStatus    = $desiredStatus;

            if ($desiredStatus === 'confirmed') {
                $completedAt      = $scheduledAt->copy()->addHour();
                $confirmedAt      = $completedAt->copy()->addHours(49);
                $payoutAt         = $confirmedAt->copy()->addMinutes(5);
                $disputeWindowEnd = $completedAt->copy()->addHours(48); // already past
            } elseif ($desiredStatus === 'completed') {
                $completedAt      = $scheduledAt->copy()->addHour();
                $disputeWindowEnd = $completedAt->copy()->addHours(48);
            } elseif ($desiredStatus === 'disputed') {
                $completedAt      = $scheduledAt->copy()->addHour();
                $disputeWindowEnd = $completedAt->copy()->addHours(48);
            }

            // Booking status/payment
            $bookingStatus  = match ($desiredStatus) {
                'scheduled','completed','confirmed','disputed' => 'accepted',
                default                                        => 'accepted',
            };
            $paymentStatus  = match ($desiredStatus) {
                'scheduled','completed','confirmed','disputed' => 'paid',
                default                                        => 'unpaid',
            };

            // Create Booking
            $booking = BookingRequest::create([
                'student_id'     => $student->id,
                'tutor_id'       => $tutor->id,
                'subject_id'     => $subjectId,
                'lesson_format'  => ($i % 2 === 0) ? 'online' : 'in_person',
                'message'        => 'حصة تجريبية - بيانات اختبارية',
                'status'         => $bookingStatus,
                'hourly_rate'    => $gross,
                'lessons_count'  => 1,
                'total_amount'   => $gross,
                'payment_status' => $paymentStatus,
            ]);

            // Create Session
            $session = Session::create([
                'booking_request_id'  => $booking->id,
                'tutor_id'            => $tutor->id,
                'student_id'          => $student->id,
                'subject_id'          => $subjectId,
                'session_number'      => 1,
                'scheduled_at'        => $scheduledAt,
                'duration_minutes'    => 60,
                'lesson_format'       => ($i % 2 === 0) ? 'online' : 'in_person',
                'meeting_link'        => ($i % 2 === 0) ? 'https://zoom.us/j/test' . rand(1000, 9999) : null,
                'recording_link'      => in_array($desiredStatus, ['completed', 'confirmed', 'disputed'])
                    ? 'https://drive.google.com/file/d/recording-test-' . ($i + 1) : null,
                'tutor_notes'         => in_array($desiredStatus, ['completed', 'confirmed'])
                    ? 'الطالب يتقدم بشكل ممتاز. يوصى بتمارين إضافية على المفاهيم الأساسية.' : null,
                'status'              => $sessionStatus,
                'completed_at'        => $completedAt,
                'confirmed_at'        => $confirmedAt,
                'dispute_window_ends' => $disputeWindowEnd,
                'cancelled_reason'    => $cancelledReason,
                'platform_fee_pct'    => $feePct,
                'gross_amount'        => $gross,
                'platform_fee'        => $platformFee,
                'tutor_payout'        => $tutorPayout,
                'payout_released_at'  => $payoutAt,
            ]);

            // Create dispute if needed
            if ($disputeStatus !== null) {
                $isResolved = ($disputeStatus !== 'open');

                SessionDispute::create([
                    'session_id'   => $session->id,
                    'raised_by'    => $student->id,
                    'reason'       => 'المعلم لم يُغطِّ المادة المتفق عليها، وانتهت الحصة قبل الوقت المحدد دون إشعار.',
                    'evidence_link'=> 'https://screenshot.example.com/evidence-' . $session->id,
                    'status'       => $disputeStatus,
                    'admin_note'   => $isResolved
                        ? 'تم مراجعة الأدلة المقدمة. القرار: ' . ($disputeStatus === 'resolved_tutor' ? 'إطلاق الأرباح للمعلم.' : 'استرداد المبلغ للطالب.')
                        : null,
                    'resolved_by'  => $isResolved ? $admin?->id : null,
                    'resolved_at'  => $isResolved ? $now->copy()->subDays(1) : null,
                ]);
            }
        }

        $count = count($scenarios);
        $this->command->info("✅ SessionsAndStudentsSeeder — {$count} sessions, " . count($studentDefs) . " students, 3 pending verification docs created.");
    }
}
