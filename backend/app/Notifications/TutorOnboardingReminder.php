<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TutorOnboardingReminder extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $completionPct,
        private readonly int $hoursAgo
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $name    = $notifiable->name;
        $pct     = $this->completionPct;
        $resumeUrl = config('app.frontend_url', 'http://localhost:3000') . '/auth/tutor-register';

        $subject = match (true) {
            $this->hoursAgo <= 24  => "مرحباً {$name} — أكمل ملفك على AlemnyPro",
            $this->hoursAgo <= 72  => "الطلاب لا يجدونك بعد — ملفك {$pct}% مكتمل",
            default                => "لا تضيّع الوقت — أكمل تسجيلك كمدرس",
        };

        return (new MailMessage)
            ->subject($subject)
            ->greeting("مرحباً {$name} 👋")
            ->line("ملفك الآن {$pct}% مكتمل.")
            ->line("الطلاب لا يمكنهم رؤيتك أو حجزك حتى تكتمل مراجعة ملفك.")
            ->action('أكمل تسجيلك الآن', $resumeUrl)
            ->line("يستغرق الأمر أقل من 10 دقائق. نحن نتطلع لمشاركتك!")
            ->salutation('فريق AlemnyPro');
    }
}
