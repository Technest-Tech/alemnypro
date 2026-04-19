<?php

namespace App\Console\Commands;

use App\Models\Session;
use App\Services\PaymentService;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class AutoConfirmSessions extends Command
{
    protected $signature   = 'sessions:auto-confirm {--dry-run : Show what would be confirmed without doing it}';
    protected $description = 'Auto-confirm completed sessions whose 48h dispute window has passed, and release tutor payouts.';

    public function __construct(
        private readonly PaymentService  $paymentService,
        private readonly WhatsAppService $whatsApp
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $sessions = Session::with(['tutor', 'student', 'subject', 'booking'])
            ->readyToAutoConfirm()
            ->get();

        if ($sessions->isEmpty()) {
            $this->info('No sessions ready to auto-confirm.');
            return self::SUCCESS;
        }

        $this->info("Found {$sessions->count()} session(s) to auto-confirm." . ($dryRun ? ' [DRY RUN]' : ''));

        $confirmed = 0;
        $failed    = 0;

        foreach ($sessions as $session) {
            try {
                if ($dryRun) {
                    $this->line("  [DRY] Session #{$session->id} — {$session->subject->name_en} — tutor payout: {$session->tutor_payout} EGP");
                    continue;
                }

                // Mark session confirmed
                $session->update([
                    'status'       => 'confirmed',
                    'confirmed_at' => now(),
                ]);

                // Release payout to tutor wallet
                $released = $this->paymentService->releaseSessionPayout($session);

                if ($released) {
                    $confirmed++;

                    // WhatsApp notify tutor
                    $tutor = $session->tutor;
                    if ($tutor && $tutor->phone) {
                        $this->whatsApp->notifyTutorPayoutReleased(
                            tutorPhone:  $tutor->phone,
                            tutorName:   $tutor->name,
                            subjectName: $session->subject->name_ar ?? $session->subject->name_en,
                            payoutAmount: (float) $session->tutor_payout,
                        );
                    }

                    Log::info('[AutoConfirm] Session confirmed & payout released', [
                        'session_id' => $session->id,
                        'tutor_id'   => $session->tutor_id,
                        'amount'     => $session->tutor_payout,
                    ]);
                }

            } catch (\Throwable $e) {
                $failed++;
                Log::error('[AutoConfirm] Failed to confirm session', [
                    'session_id' => $session->id,
                    'error'      => $e->getMessage(),
                ]);
                $this->error("  Failed session #{$session->id}: {$e->getMessage()}");
            }
        }

        if (! $dryRun) {
            $this->info("✅ Confirmed: {$confirmed} | ❌ Failed: {$failed}");
        }

        return self::SUCCESS;
    }
}
