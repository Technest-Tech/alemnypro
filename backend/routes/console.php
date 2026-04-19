<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('alemny:check-group-thresholds')->hourly();

// Send onboarding reminder emails at 24h, 72h, and 7-day intervals
// Runs hourly; the command itself calculates the exact windows.
Schedule::command('onboarding:remind')->hourly();
