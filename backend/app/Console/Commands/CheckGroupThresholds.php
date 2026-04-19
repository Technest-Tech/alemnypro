<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GroupSession;
use App\Services\GroupSessionService;
use Carbon\Carbon;

class CheckGroupThresholds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alemny:check-group-thresholds';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check group sessions approaching start time (12h) to enforce minimum thresholds.';

    /**
     * Execute the console command.
     */
    public function handle(GroupSessionService $service)
    {
        $this->info('Starting group threshold checks...');

        // Find all open sessions starting within the next 12 to 13 hours
        // So we only process them around the 12h-before mark
        $targetStart = Carbon::now()->addHours(12);
        $targetEnd = clone $targetStart;
        $targetEnd->addHour();

        $sessions = GroupSession::where('status', 'open')
            ->whereNull('threshold_checked_at')
            ->where(function($query) use ($targetStart, $targetEnd) {
                // Combine session_date and session_time
                // Simple approach: date = targetDate
                $query->whereDate('session_date', $targetStart->toDateString())
                      ->whereTime('session_time', '>=', $targetStart->toTimeString())
                      ->whereTime('session_time', '<=', $targetEnd->toTimeString());
            })
            ->get();

        $this->info("Found {$sessions->count()} sessions to evaluate.");

        foreach ($sessions as $session) {
            $this->info("Evaluating session #{$session->id} ({$session->title_en})");
            $service->checkThreshold($session);
        }

        $this->info('Finished threshold checks.');
    }
}
