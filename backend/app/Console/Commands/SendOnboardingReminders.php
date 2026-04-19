<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\TutorOnboardingReminder;
use Illuminate\Console\Command;

class SendOnboardingReminders extends Command
{
    protected $signature   = 'onboarding:remind';
    protected $description = 'Send reminder emails to tutors who have not completed their onboarding profile';

    public function handle(): void
    {
        // Reminder intervals: 24h, 72h (3 days), 168h (7 days)
        $intervals = [24, 72, 168];

        foreach ($intervals as $hours) {
            $from = now()->subHours($hours + 1);
            $to   = now()->subHours($hours);

            User::role('tutor')
                ->whereHas('tutorProfile', fn ($q) =>
                    $q->where('onboarding_status', 'draft')
                      ->whereBetween('created_at', [$from, $to])
                )
                ->with('tutorProfile')
                ->get()
                ->each(function (User $user) use ($hours) {
                    $pct = $this->completionPct($user->tutorProfile);
                    // Don't spam tutors who are nearly done (>= 90%)
                    if ($pct >= 100) return;

                    $user->notify(new TutorOnboardingReminder($pct, $hours));
                    $this->info("Reminded {$user->email} ({$hours}h reminder, {$pct}% done)");
                });
        }

        $this->info('Onboarding reminders sent.');
    }

    private function completionPct($profile): int
    {
        if (!$profile) return 0;
        $steps = [
            !empty($profile->headline_ar) || !empty($profile->headline_en),
            $profile->tutorSubjects()->count() >= 1,
            !empty($profile->lesson_format_details),
            (float) $profile->hourly_rate > 0,
            $profile->documents()->whereIn('type', ['national_id_front', 'national_id_back', 'criminal_record'])->count() >= 3,
            $profile->availabilities()->count() >= 3,
        ];
        $done = count(array_filter($steps));
        return (int) round((($done + 1) / 7) * 100); // +1 for account
    }
}
