<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wasender WhatsApp API service.
 *
 * API Docs: https://wasenderapi.com
 * Auth:     Bearer token in Authorization header
 * JID:      <phone>@s.whatsapp.net   (e.g. 201012345678@s.whatsapp.net)
 */
class WasenderService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.wasender.url', 'https://wasenderapi.com/api'), '/');
        $this->token   = config('services.wasender.token', '');
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Normalise a phone number to Wasender JID format: <digits>@s.whatsapp.net
     * Accepts: +201012345678, 01012345678, 201012345678, etc.
     */
    public static function phoneToJid(string $phone): string
    {
        // Strip everything except digits
        $digits = preg_replace('/\D/', '', $phone);

        // Egyptian numbers: if starts with 0, prefix with 20 (country code)
        if (str_starts_with($digits, '0') && strlen($digits) === 11) {
            $digits = '20' . substr($digits, 1);
        }

        return $digits . '@s.whatsapp.net';
    }

    /**
     * Check whether a number is registered on WhatsApp.
     */
    public function isOnWhatsApp(string $phone): bool
    {
        $jid = self::phoneToJid($phone);

        try {
            $response = Http::withToken($this->token)
                ->timeout(10)
                ->get("{$this->baseUrl}/on-whatsapp/{$jid}");

            // 200 + {"exists": true} means the number is on WhatsApp
            return $response->ok() && data_get($response->json(), 'exists', false);
        } catch (\Throwable $e) {
            Log::warning('Wasender isOnWhatsApp check failed', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);
            // Fail open — if the API is down, let the message attempt proceed
            return true;
        }
    }

    /**
     * Send a text message via WhatsApp.
     *
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public function sendText(string $phone, string $text): array
    {
        $jid = self::phoneToJid($phone);

        // Dev guard: if no token configured, just log
        if (empty($this->token)) {
            Log::info("📱 [WasenderDev] Would send WhatsApp to {$jid}: {$text}");
            return ['success' => true, 'message_id' => 'dev-' . uniqid(), 'error' => null];
        }

        try {
            $response = Http::withToken($this->token)
                ->timeout(15)
                ->post("{$this->baseUrl}/send-message", [
                    'to'   => $jid,
                    'text' => $text,
                ]);

            if ($response->ok()) {
                Log::info('WhatsApp message sent', [
                    'to'         => $jid,
                    'message_id' => data_get($response->json(), 'id'),
                ]);

                return [
                    'success'    => true,
                    'message_id' => data_get($response->json(), 'id'),
                    'error'      => null,
                ];
            }

            $errMsg = data_get($response->json(), 'message', $response->body());
            Log::error('Wasender send failed', ['to' => $jid, 'status' => $response->status(), 'body' => $errMsg]);

            return ['success' => false, 'message_id' => null, 'error' => $errMsg];
        } catch (\Throwable $e) {
            Log::error('Wasender sendText exception', ['to' => $jid, 'error' => $e->getMessage()]);
            return ['success' => false, 'message_id' => null, 'error' => $e->getMessage()];
        }
    }

    /**
     * Send an image message.
     */
    public function sendImage(string $phone, string $imageUrl, string $caption = ''): array
    {
        $jid = self::phoneToJid($phone);

        if (empty($this->token)) {
            Log::info("📱 [WasenderDev] Would send image to {$jid}: {$imageUrl}");
            return ['success' => true, 'message_id' => 'dev-' . uniqid(), 'error' => null];
        }

        try {
            $payload = ['to' => $jid, 'imageUrl' => $imageUrl];
            if ($caption) $payload['caption'] = $caption;

            $response = Http::withToken($this->token)
                ->timeout(20)
                ->post("{$this->baseUrl}/send-message", $payload);

            return [
                'success'    => $response->ok(),
                'message_id' => data_get($response->json(), 'id'),
                'error'      => $response->ok() ? null : data_get($response->json(), 'message', $response->body()),
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'message_id' => null, 'error' => $e->getMessage()];
        }
    }
}
