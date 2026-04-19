<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class ContactVerificationController extends Controller
{
    // ─── Email Verification ────────────────────────────────────────────────────

    public function sendEmailOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return $this->error('Email is already verified.');
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = "email_otp:{$user->id}";

        Cache::put($cacheKey, $otp, now()->addMinutes(10));

        // Send the premium HTML OTP email
        try {
            Mail::to($user->email)->send(new \App\Mail\OtpVerificationMail($otp, $user->name ?? 'Tutor'));
        } catch (\Throwable $e) {
            // In dev, just log — don't crash
            logger()->error('Email OTP send failed: ' . $e->getMessage());
        }

        return $this->success(
            ['expires_in' => 600],
            'Verification code sent to your email.'
        );
    }

    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $request->validate(['otp' => ['required', 'string', 'size:6']]);

        $user     = $request->user();
        $cacheKey = "email_otp:{$user->id}";
        $stored   = Cache::get($cacheKey);

        if (!$stored || $stored !== $request->otp) {
            return $this->error('Invalid or expired verification code.', 422);
        }

        $user->update(['email_verified_at' => now()]);
        Cache::forget($cacheKey);

        return $this->success(null, 'Email verified successfully.');
    }

    // ─── Phone Verification ────────────────────────────────────────────────────

    public function sendPhoneOtp(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'phone' => ['sometimes', 'string', 'min:8', 'max:20'],
        ]);

        // Allow saving a phone number first if not set
        if ($request->has('phone') && $request->phone !== $user->phone) {
            $request->validate([
                'phone' => ['unique:users,phone'],
            ]);
            $user->update(['phone' => $request->phone, 'phone_verified_at' => null]);
            $user->refresh();
        }

        if (!$user->phone) {
            return $this->error('Please provide a phone number first.', 422);
        }

        if ($user->phone_verified_at) {
            return $this->error('Phone number is already verified.');
        }

        // Rate limit: max 1 OTP per 60 seconds
        $throttleKey = "phone_otp_throttle:{$user->id}";
        if (Cache::has($throttleKey)) {
            return $this->error('Please wait before requesting a new code.', 429);
        }

        $otp      = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = "phone_otp:{$user->id}";

        Cache::put($cacheKey, $otp, now()->addMinutes(10));
        Cache::put($throttleKey, true, now()->addSeconds(60));

        // ── Send via Wasender WhatsApp API ──────────────────────────
        $wasender = new \App\Services\WasenderService();

        $message = "🔐 *AlemnyPro - رمز التحقق*\n\n"
                 . "مرحباً،\n"
                 . "رمز التحقق الخاص بك هو: *{$otp}*\n\n"
                 . "⏳ صلاحية الرمز: 10 دقائق فقط.\n"
                 . "🔒 لا تشارك هذا الرمز مع أي أحد.\n\n"
                 . "إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.\n\n"
                 . "— فريق AlemnyPro ✨";

        $result = $wasender->sendText($user->phone, $message);

        if (!$result['success']) {
            logger()->warning('WhatsApp OTP send failed, falling back to log', [
                'user_id' => $user->id,
                'phone'   => $user->phone,
                'error'   => $result['error'],
            ]);
            // Log the OTP so dev can still test
            logger()->info("📱 Phone OTP for user {$user->id} ({$user->phone}): {$otp}");
        }

        return $this->success(
            ['expires_in' => 600, 'phone' => $user->phone],
            'Verification code sent via WhatsApp.'
        );
    }

    public function verifyPhoneOtp(Request $request): JsonResponse
    {
        $request->validate(['otp' => ['required', 'string', 'size:6']]);

        $user     = $request->user();
        $cacheKey = "phone_otp:{$user->id}";
        $stored   = Cache::get($cacheKey);

        if (!$stored || $stored !== $request->otp) {
            return $this->error('Invalid or expired verification code.', 422);
        }

        $user->update(['phone_verified_at' => now()]);
        Cache::forget($cacheKey);

        return $this->success(null, 'Phone number verified successfully.');
    }
}
