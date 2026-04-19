<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TutorProfile;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google callback.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect(config('app.frontend_url', 'http://localhost:3000') . '/auth/login?error=google_auth_failed');
        }

        // Find or create user
        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'password' => Hash::make(Str::random(24)),
                'role' => 'student', // Default role for Google sign-ups
                'locale' => 'ar',
                'is_active' => true,
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);

            $user->assignRole('student');

            StudentProfile::create([
                'user_id' => $user->id,
            ]);
        } else {
            // Update Google ID and avatar if not set
            $user->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $user->avatar ?? $googleUser->getAvatar(),
            ]);
        }

        // Create token
        $token = $user->createToken('google-auth')->plainTextToken;

        // Redirect to frontend with token
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $params = http_build_query([
            'token' => $token,
            'user' => json_encode([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
            ]),
        ]);

        return redirect("{$frontendUrl}/auth/callback?{$params}");
    }
}
