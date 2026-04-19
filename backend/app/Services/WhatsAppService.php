<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * WhatsApp Notification Service
 *
 * Delegates all sending to WasenderService — the same proven
 * implementation used by the OTP phone-verification flow.
 *
 * Credentials (.env):
 *   WASENDER_API_URL=https://wasenderapi.com/api
 *   WASENDER_API_TOKEN=your_token
 */
class WhatsAppService
{
    private WasenderService $wasender;

    public function __construct()
    {
        $this->wasender = new WasenderService();
    }

    // ─── Core Send ──────────────────────────────────────────────────────────────

    /**
     * Send a WhatsApp text message.
     * Accepts any phone format — WasenderService normalises it to JID.
     */
    public function send(string $phone, string $message): bool
    {
        $result = $this->wasender->sendText($phone, $message);

        if (! $result['success']) {
            Log::warning('[WhatsApp] Send failed', [
                'to'    => $phone,
                'error' => $result['error'],
            ]);
        }

        return $result['success'];
    }

    // ─── Session Notifications ────────────────────────────────────

    /**
     * Notify student that sessions have been scheduled by tutor.
     */
    public function notifyStudentSessionsScheduled(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        int    $sessionCount,
        string $firstSessionDate
    ): bool {
        $message = "مرحباً {$studentName} 👋\n\n"
            . "قام المدرس *{$tutorName}* بجدولة *{$sessionCount} حصص* لمادة *{$subjectName}*.\n\n"
            . "📅 أول حصة: *{$firstSessionDate}*\n\n"
            . "يمكنك مراجعة كل تفاصيل الحصص من لوحة التحكم الخاصة بك على AlemnyPro.\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /**
     * Send 24h reminder to tutor and student before a session.
     */
    public function sendSessionReminder24h(
        string $recipientPhone,
        string $recipientName,
        string $subjectName,
        string $sessionDateTime,
        string $role = 'student'  // 'student' | 'tutor'
    ): bool {
        if ($role === 'tutor') {
            $message = "تذكير للمدرس 📅\n\n"
                . "لديك حصة *{$subjectName}* غداً 🗓\n"
                . "🕐 *{$sessionDateTime}*\n\n"
                . "تذكر إضافة رابط الاجتماع إذا لم تفعل بعد.\n\n"
                . "_فريق AlemnyPro_ 🎓";
        } else {
            $message = "تذكير للطالب 📅\n\n"
                . "مرحباً {$recipientName}، لديك حصة *{$subjectName}* غداً 🗓\n"
                . "🕐 *{$sessionDateTime}*\n\n"
                . "ستجد رابط الاجتماع في لوحة التحكم قبل موعد الحصة.\n\n"
                . "_فريق AlemnyPro_ 🎓";
        }

        return $this->send($recipientPhone, $message);
    }

    /**
     * Send 1h reminder to tutor and student before a session.
     */
    public function sendSessionReminder1h(
        string $recipientPhone,
        string $recipientName,
        string $subjectName,
        string $meetingLink = ''
    ): bool {
        $linkLine = $meetingLink
            ? "\n🔗 رابط الاجتماع: {$meetingLink}"
            : "\n📌 تحقق من رابط الاجتماع في لوحة التحكم.";

        $message = "⏰ الحصة بتبدأ بعد ساعة!\n\n"
            . "مادة *{$subjectName}*{$linkLine}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($recipientPhone, $message);
    }

    /**
     * Notify student that tutor has marked session complete — dispute window opens.
     */
    public function notifyStudentSessionCompleted(
        string $studentPhone,
        string $studentName,
        string $subjectName,
        string $tutorName,
        int    $disputeWindowHours,
        string $recordingLink = ''
    ): bool {
        $recordingLine = $recordingLink
            ? "\n📹 تسجيل الحصة: {$recordingLink}"
            : '';

        $message = "✅ تم تأكيد انتهاء الحصة\n\n"
            . "مرحباً {$studentName}،\n"
            . "أكد المدرس *{$tutorName}* انتهاء حصة *{$subjectName}*.{$recordingLine}\n\n"
            . "⚠️ *لديك {$disputeWindowHours} ساعة* للاعتراض على هذه الحصة إذا لم تتم كما ينبغي.\n"
            . "إذا لم يُرفع اعتراض، سيتم تأكيد الحصة تلقائياً وإطلاق المبلغ للمدرس.\n\n"
            . "يمكنك الاعتراض من خلال لوحة التحكم الخاصة بك.\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /**
     * Notify tutor that the payout for a session has been released.
     */
    public function notifyTutorPayoutReleased(
        string $tutorPhone,
        string $tutorName,
        string $subjectName,
        float  $payoutAmount,
        string $currency = 'EGP'
    ): bool {
        $message = "💰 تم إطلاق المبلغ!\n\n"
            . "مرحباً {$tutorName}،\n"
            . "تم تحويل *{$payoutAmount} {$currency}* إلى محفظتك مقابل حصة *{$subjectName}* ✅\n\n"
            . "يمكنك مراجعة رصيد محفظتك من لوحة التحكم.\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($tutorPhone, $message);
    }

    /**
     * Notify tutor that a student has raised a dispute.
     */
    public function notifyTutorDisputeRaised(
        string $tutorPhone,
        string $tutorName,
        string $subjectName,
        string $studentName
    ): bool {
        $message = "⚠️ اعتراض على حصة\n\n"
            . "مرحباً {$tutorName}،\n"
            . "رفع الطالب *{$studentName}* اعتراضاً على حصة *{$subjectName}*.\n\n"
            . "سيقوم فريق AlemnyPro بمراجعة تسجيل الحصة والتواصل معكم.\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($tutorPhone, $message);
    }

    /**
     * Notify both parties of dispute resolution.
     */
    public function notifyDisputeResolved(
        string $recipientPhone,
        string $recipientName,
        string $subjectName,
        string $resolution,  // 'tutor' | 'student'
        string $role         // 'tutor' | 'student'
    ): bool {
        if ($role === 'tutor') {
            $message = $resolution === 'tutor'
                ? "✅ تم حل الاعتراض لصالحك\n\nمرحباً {$recipientName}،\nتمت مراجعة الاعتراض على حصة *{$subjectName}* وتم حله لصالحك. سيتم إطلاق المبلغ لمحفظتك.\n\n_فريق AlemnyPro_ 🎓"
                : "ℹ️ نتيجة الاعتراض\n\nمرحباً {$recipientName}،\nبعد مراجعة اعتراض حصة *{$subjectName}*، تم اتخاذ قرار لصالح الطالب. لمزيد من التفاصيل، تواصل مع الدعم.\n\n_فريق AlemnyPro_ 🎓";
        } else {
            $message = $resolution === 'student'
                ? "✅ تم حل الاعتراض لصالحك\n\nمرحباً {$recipientName}،\nتمت مراجعة اعتراضك على حصة *{$subjectName}* وتم استرداد المبلغ إلى محفظتك.\n\n_فريق AlemnyPro_ 🎓"
                : "ℹ️ نتيجة الاعتراض\n\nمرحباً {$recipientName}،\nبعد مراجعة اعتراضك على حصة *{$subjectName}*، تم اتخاذ قرار لصالح المدرس. لمزيد من التفاصيل، تواصل مع الدعم.\n\n_فريق AlemnyPro_ 🎓";
        }

        return $this->send($recipientPhone, $message);
    }

    /**
     * Notify student that their booking has been accepted — prompt to pay.
     */
    public function notifyStudentBookingAccepted(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        float  $totalAmount,
        int    $lessonsCount,
        string $currency = 'EGP'
    ): bool {
        $message = "🎉 تم قبول طلب حجزك!\n\n"
            . "مرحباً {$studentName}،\n"
            . "قبل المدرس *{$tutorName}* طلبك لتعلم *{$subjectName}*.\n\n"
            . "📦 *{$lessonsCount} حصص* — إجمالي: *{$totalAmount} {$currency}*\n\n"
            . "⚡ أكمل الدفع الآن لتأكيد الحجز وجدولة حصصك:\n"
            . config('app.frontend_url') . "/dashboard/student/bookings\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    // ─── Chat / Messaging Notifications ──────────────────────────

    /** Notify tutor about new booking request from student */
    public function notifyTutorNewBookingRequest(
        string $tutorPhone,
        string $tutorName,
        string $studentName,
        string $subjectName,
        string $dashboardUrl
    ): bool {
        $message = "📩 طلب حجز جديد!\n\n"
            . "مرحباً {$tutorName}،\n"
            . "أرسل الطالب *{$studentName}* طلب حجز لمادة *{$subjectName}*.\n\n"
            . "🔗 راجع الطلب وقبله أو رفضه من هنا:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($tutorPhone, $message);
    }

    /** Notify student their booking request was received */
    public function notifyStudentBookingRequestSent(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        string $dashboardUrl
    ): bool {
        $message = "✅ *تم إرسال طلب الحجز بنجاح!*\n\n"
            . "مرحباً {$studentName}،\n"
            . "تم إرسال طلبك للمدرس *{$tutorName}* لمادة *{$subjectName}*.\n\n"
            . "⏳ سيتم مراجعة طلبك والرد عليه في أقرب وقت.\n\n"
            . "📲 يمكنك متابعة الطلب من هنا:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /** Notify student that booking was accepted */
    public function notifyStudentBookingAcceptedChat(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        string $dashboardUrl
    ): bool {
        $message = "🎉 تم قبول طلبك!\n\n"
            . "مرحباً {$studentName}،\n"
            . "قبل المدرس *{$tutorName}* طلبك لتعلم *{$subjectName}*.\n\n"
            . "تم مشاركة بيانات التواصل في المحادثة. 📱\n\n"
            . "🔗 افتح المحادثة هنا:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /** Notify student that booking was rejected */
    public function notifyStudentBookingRejected(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        string $dashboardUrl
    ): bool {
        $message = "ℹ️ تحديث طلب الحجز\n\n"
            . "مرحباً {$studentName}،\n"
            . "للأسف لم يتمكن المدرس *{$tutorName}* من قبول طلبك لمادة *{$subjectName}* في الوقت الحالي.\n\n"
            . "يمكنك البحث عن معلمين آخرين أو إرسال طلب جديد لاحقاً.\n\n"
            . "🔗 {$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /** Notify of a new text message */
    public function notifyNewChatMessage(
        string $recipientPhone,
        string $recipientName,
        string $senderName,
        string $messagePreview,
        string $dashboardUrl
    ): bool {
        $message = "💬 رسالة جديدة من {$senderName}\n\n"
            . "مرحباً {$recipientName}،\n"
            . "\"_{$messagePreview}_\"\n\n"
            . "🔗 رد على الرسالة هنا:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($recipientPhone, $message);
    }

    /** Notify of a date/time proposal */
    public function notifyDateProposal(
        string $recipientPhone,
        string $recipientName,
        string $proposerName,
        string $proposedDate,
        string $proposedTime,
        string $dashboardUrl
    ): bool {
        $message = "📅 اقتراح موعد جديد\n\n"
            . "مرحباً {$recipientName}،\n"
            . "اقترح *{$proposerName}* موعداً للحصة:\n"
            . "📆 *{$proposedDate}* — 🕐 *{$proposedTime}*\n\n"
            . "🔗 وافق على الموعد أو اقترح وقتاً آخر:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($recipientPhone, $message);
    }

    /** Notify of confirmed date */
    public function notifyDateConfirmed(
        string $recipientPhone,
        string $recipientName,
        string $confirmedDate,
        string $confirmedTime,
        string $dashboardUrl
    ): bool {
        $message = "✅ تم تأكيد موعد الحصة!\n\n"
            . "مرحباً {$recipientName}،\n"
            . "📆 التاريخ: *{$confirmedDate}*\n"
            . "🕐 الوقت: *{$confirmedTime}*\n\n"
            . "🔗 تفاصيل الحصة:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($recipientPhone, $message);
    }

    /** Notify student of payment link */
    public function notifyStudentPaymentLink(
        string $studentPhone,
        string $studentName,
        string $tutorName,
        string $subjectName,
        float  $totalAmount,
        int    $lessonsCount,
        string $paymentUrl,
        string $currency = 'EGP'
    ): bool {
        $message = "💳 رابط الدفع جاهز!\n\n"
            . "مرحباً {$studentName}،\n"
            . "أرسل لك المدرس *{$tutorName}* رابط دفع لـ *{$lessonsCount} حصص* في مادة *{$subjectName}*.\n\n"
            . "💰 الإجمالي: *{$totalAmount} {$currency}*\n\n"
            . "⚡ ادفع الآن لتأكيد حصصك:\n{$paymentUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($studentPhone, $message);
    }

    /** Notify tutor that student has paid */
    public function notifyTutorPaymentReceived(
        string $tutorPhone,
        string $tutorName,
        string $studentName,
        string $subjectName,
        float  $totalAmount,
        int    $lessonsCount,
        string $dashboardUrl,
        string $currency = 'EGP'
    ): bool {
        $message = "💰 تم الدفع!\n\n"
            . "مرحباً {$tutorName}،\n"
            . "أكمل الطالب *{$studentName}* دفع *{$lessonsCount} حصص* في مادة *{$subjectName}*.\n\n"
            . "✅ المبلغ: *{$totalAmount} {$currency}*\n\n"
            . "🔗 جدّل الحصص الآن:\n{$dashboardUrl}\n\n"
            . "_فريق AlemnyPro_ 🎓";

        return $this->send($tutorPhone, $message);
    }

}
