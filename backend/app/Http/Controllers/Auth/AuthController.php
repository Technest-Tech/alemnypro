<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TutorProfile;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'unique:users,phone'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', 'in:student,tutor'],
            'locale' => ['sometimes', 'in:ar,en'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'locale' => $validated['locale'] ?? 'ar',
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        // Create profile based on role
        if ($validated['role'] === 'tutor') {
            TutorProfile::create([
                'user_id' => $user->id,
                'slug' => Str::slug($user->name) . '-' . $user->id,
                'currency' => 'EGP',
            ]);
        } elseif ($validated['role'] === 'student') {
            StudentProfile::create([
                'user_id' => $user->id,
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->created([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'locale' => $user->locale,
            ],
            'token' => $token,
        ], 'Registration successful');
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return $this->unauthorized('Invalid credentials');
        }

        if (!$user->is_active) {
            return $this->forbidden('Account is suspended');
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $userData = [
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'phone'  => $user->phone,
            'role'   => $user->role,
            'locale' => $user->locale,
            'avatar' => $user->avatar,
        ];

        // For tutors: include onboarding state so frontend can redirect correctly
        if ($user->role === 'tutor' && $user->tutorProfile) {
            $userData['onboarding_status'] = $user->tutorProfile->onboarding_status;
            $userData['onboarding_step']   = $user->tutorProfile->onboarding_step;
        }

        return $this->success([
            'user'  => $userData,
            'token' => $token,
        ], 'Login successful');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return $this->success(null, 'Logged out successfully');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = [
            'id'                 => $user->id,
            'name'               => $user->name,
            'email'              => $user->email,
            'phone'              => $user->phone,
            'role'               => $user->role,
            'locale'             => $user->locale,
            'avatar'             => $user->avatar,
            'email_verified_at'  => $user->email_verified_at,
            'phone_verified_at'  => $user->phone_verified_at,
        ];

        if ($user->isTutor()) {
            $data['tutor_profile'] = $user->tutorProfile?->load(['governorate', 'city', 'neighborhood', 'subjects']);
        } elseif ($user->isStudent()) {
            $data['student_profile'] = $user->studentProfile;
        }

        return $this->success($data);
    }

    /**
     * Upgrade a student account to a tutor account.
     * Creates a TutorProfile and changes the user's role.
     */
    public function upgradeToTutor(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'student') {
            return $this->forbidden('Only student accounts can upgrade to tutor');
        }

        // Already has a tutor profile somehow — just update role
        if (!$user->tutorProfile) {
            TutorProfile::create([
                'user_id' => $user->id,
                'slug'    => Str::slug($user->name) . '-' . $user->id,
                'currency' => 'EGP',
            ]);
        }

        $user->update(['role' => 'tutor']);
        $user->assignRole('tutor');

        // Reload relationships
        $user->refresh();
        $user->load('tutorProfile');

        return $this->success([
            'user' => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'phone'  => $user->phone,
                'role'   => $user->role,
                'locale' => $user->locale,
                'avatar' => $user->avatar,
                'onboarding_status' => $user->tutorProfile?->onboarding_status,
                'onboarding_step'   => $user->tutorProfile?->onboarding_step,
            ],
        ], 'Account upgraded to tutor successfully');
    }
}
