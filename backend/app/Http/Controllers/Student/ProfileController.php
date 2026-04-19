<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    /** GET /student/profile */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->only([
            'id', 'name', 'email', 'phone', 'avatar', 'locale',
            'email_verified_at', 'phone_verified_at',
            'wallet_balance', 'created_at',
        ]);

        return $this->success($user);
    }

    /** PUT /student/profile */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'   => ['sometimes', 'string', 'min:2', 'max:100'],
            'email'  => ['sometimes', 'email',  Rule::unique('users', 'email')->ignore($user->id)],
            'phone'  => ['sometimes', 'nullable', 'string', 'min:8', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'locale' => ['sometimes', 'in:ar,en'],
        ]);

        // If email changed, reset verification
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $validated['email_verified_at'] = null;
        }

        // If phone changed, reset verification
        if (array_key_exists('phone', $validated) && $validated['phone'] !== $user->phone) {
            $validated['phone_verified_at'] = null;
        }

        $user->update($validated);

        return $this->success(
            $user->only(['id', 'name', 'email', 'phone', 'avatar', 'locale', 'email_verified_at', 'phone_verified_at']),
            'Profile updated successfully'
        );
    }

    /** POST /student/profile/avatar */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        $path      = $request->file('avatar')->store('avatars', 'public');
        $avatarUrl = Storage::disk('public')->url($path);

        $user->update(['avatar' => $avatarUrl]);

        return $this->success(['avatar_url' => $avatarUrl], 'Avatar uploaded');
    }

    /** POST /student/profile/change-password */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return $this->error('كلمة المرور الحالية غير صحيحة', 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return $this->success(null, 'Password changed successfully');
    }
}
