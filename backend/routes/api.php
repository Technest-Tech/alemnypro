<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AlemnyPro API Routes (v1)
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1 (configured in bootstrap/app.php)
|
*/

// ─── Health Check ───
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'AlemnyPro API v1']));

// ─── Public Routes (No Auth) ───
Route::prefix('public')->group(function () {
    // Search tutors
    Route::get('/search/tutors',      [\App\Http\Controllers\Public\SearchController::class, 'tutors']);
    Route::get('/search/categories',  [\App\Http\Controllers\Public\SearchController::class, 'categories']);

    // Tutors
    Route::get('/tutors/featured', [\App\Http\Controllers\Public\TutorController::class, 'featured']);
    Route::get('/tutors/{slug}', [\App\Http\Controllers\Public\TutorController::class, 'show']);

    // Group Sessions
    Route::get('/group-sessions', [\App\Http\Controllers\Public\GroupSessionController::class, 'index']);
    Route::get('/group-sessions/{id}', [\App\Http\Controllers\Public\GroupSessionController::class, 'show']);

    // Taxonomy — ⚠️ /subjects/search MUST be before /subjects/{category_slug}
    Route::get('/categories', [\App\Http\Controllers\Public\CategoryController::class, 'index']);
    Route::get('/subjects/search', [\App\Http\Controllers\Public\SubjectController::class, 'search']);
    Route::get('/subjects', [\App\Http\Controllers\Public\SubjectController::class, 'index']);
    Route::get('/subjects/{category_slug}', [\App\Http\Controllers\Public\SubjectController::class, 'byCategory']);

    // Locations
    Route::get('/locations/governorates', [\App\Http\Controllers\Public\LocationController::class, 'governorates']);
    Route::get('/locations/cities/{governorate}', [\App\Http\Controllers\Public\LocationController::class, 'cities']);
    Route::get('/locations/neighborhoods/{city}', [\App\Http\Controllers\Public\LocationController::class, 'neighborhoods']);

    // ── Payment Page (token-based, no auth required) ──
    Route::get('/payment/{token}',      [\App\Http\Controllers\Public\PaymentPageController::class, 'show']);
    Route::post('/payment/{token}/pay', [\App\Http\Controllers\Public\PaymentPageController::class, 'pay']);
});

// ─── Auth Routes ───
Route::prefix('auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Auth\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Auth\AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout']);
        Route::get('/me', [\App\Http\Controllers\Auth\AuthController::class, 'me']);
        Route::post('/upgrade-to-tutor', [\App\Http\Controllers\Auth\AuthController::class, 'upgradeToTutor']);
    });
});

// ─── Tutor Routes (Authenticated + Role: tutor) ───
Route::prefix('tutor')->middleware(['auth:sanctum', 'role:tutor'])->group(function () {

    // ── Onboarding Wizard ──
    Route::prefix('onboarding')->group(function () {
        Route::get('/status',   [\App\Http\Controllers\Tutor\OnboardingController::class, 'getStatus']);
        Route::patch('/step-1', [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep1']);
        Route::patch('/step-2', [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep2']);
        Route::patch('/step-3', [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep3']);
        Route::patch('/step-4', [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep4']);
        Route::post('/step-5',  [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep5']); // POST: PHP only parses multipart on POST
        Route::patch('/step-6', [\App\Http\Controllers\Tutor\OnboardingController::class, 'saveStep6']);
        Route::post('/submit',  [\App\Http\Controllers\Tutor\OnboardingController::class, 'submit']);
    });

    // ── Profile ──
    Route::get('/profile', [\App\Http\Controllers\Tutor\ProfileController::class, 'show']);
    Route::put('/profile', [\App\Http\Controllers\Tutor\ProfileController::class, 'update']);
    Route::post('/profile/avatar', [\App\Http\Controllers\Tutor\ProfileController::class, 'uploadAvatar']);

    // ── Subjects ──
    // ⚠️ /subjects/requests and /subjects/request must be before /subjects/{id}
    Route::get('/subjects/requests', [\App\Http\Controllers\Tutor\SubjectRequestController::class, 'index']);
    Route::post('/subjects/request', [\App\Http\Controllers\Tutor\SubjectRequestController::class, 'store']);
    Route::get('/subjects', [\App\Http\Controllers\Tutor\SubjectController::class, 'index']);
    Route::post('/subjects', [\App\Http\Controllers\Tutor\SubjectController::class, 'store']);
    Route::put('/subjects/{id}', [\App\Http\Controllers\Tutor\SubjectController::class, 'update']);
    Route::delete('/subjects/{id}', [\App\Http\Controllers\Tutor\SubjectController::class, 'destroy']);

    // ── Availability ──
    Route::get('/availability', [\App\Http\Controllers\Tutor\AvailabilityController::class, 'index']);
    Route::post('/availability', [\App\Http\Controllers\Tutor\AvailabilityController::class, 'sync']);

    // ── Bookings ──
    Route::get('/bookings', [\App\Http\Controllers\Tutor\BookingController::class, 'index']);
    Route::put('/bookings/{id}/accept', [\App\Http\Controllers\Tutor\BookingController::class, 'accept']);
    Route::put('/bookings/{id}/reject', [\App\Http\Controllers\Tutor\BookingController::class, 'reject']);

    // ── Sessions ──
    Route::get('/sessions', [\App\Http\Controllers\Tutor\SessionController::class, 'index']);
    Route::post('/bookings/{id}/sessions', [\App\Http\Controllers\Tutor\SessionController::class, 'store']);
    Route::get('/sessions/{id}', [\App\Http\Controllers\Tutor\SessionController::class, 'show']);
    Route::put('/sessions/{id}', [\App\Http\Controllers\Tutor\SessionController::class, 'update']);
    Route::post('/sessions/{id}/complete', [\App\Http\Controllers\Tutor\SessionController::class, 'complete']);
    Route::put('/sessions/{id}/cancel', [\App\Http\Controllers\Tutor\SessionController::class, 'cancel']);

    // ── Group Sessions ──
    Route::get('/group-sessions', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'index']);
    Route::post('/group-sessions', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'store']);
    Route::get('/group-sessions/{id}', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'show']);
    Route::put('/group-sessions/{id}', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'update']);
    Route::put('/group-sessions/{id}/confirm', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'confirm']);
    Route::put('/group-sessions/{id}/cancel', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'cancel']);
    Route::post('/group-sessions/{id}/complete', [\App\Http\Controllers\Tutor\GroupSessionController::class, 'complete']);

    // ── Verification ──
    Route::post('/verification/upload', [\App\Http\Controllers\Tutor\VerificationController::class, 'upload']);
    Route::get('/verification/status', [\App\Http\Controllers\Tutor\VerificationController::class, 'status']);

    // ── Dashboard ──
    Route::get('/dashboard/stats',      [\App\Http\Controllers\Tutor\DashboardController::class, 'stats']);
    Route::get('/dashboard/onboarding', [\App\Http\Controllers\Tutor\DashboardController::class, 'onboardingStatus']);

    // ── Reviews ──
    Route::get('/reviews', [\App\Http\Controllers\Tutor\ReviewController::class, 'index']);

    // ── Earnings & Payouts ──
    Route::get('/earnings',                  [\App\Http\Controllers\Tutor\EarningsController::class, 'index']);
    Route::get('/earnings/invoices',         [\App\Http\Controllers\Tutor\EarningsController::class, 'invoices']);
    Route::get('/payout-preferences',        [\App\Http\Controllers\Tutor\EarningsController::class, 'getPayoutPreferences']);
    Route::post('/payout-preferences',       [\App\Http\Controllers\Tutor\EarningsController::class, 'savePayoutPreference']);
    // ── Contact Verification (Email & Phone OTP) ──
    Route::post('/contact/send-email-otp',   [\App\Http\Controllers\Tutor\ContactVerificationController::class, 'sendEmailOtp']);
    Route::post('/contact/verify-email',     [\App\Http\Controllers\Tutor\ContactVerificationController::class, 'verifyEmailOtp']);
    Route::post('/contact/send-phone-otp',   [\App\Http\Controllers\Tutor\ContactVerificationController::class, 'sendPhoneOtp']);
    Route::post('/contact/verify-phone',     [\App\Http\Controllers\Tutor\ContactVerificationController::class, 'verifyPhoneOtp']);

    // ── Conversations / Messaging ──
    Route::get('/conversations',                                       [\App\Http\Controllers\Tutor\MessageController::class, 'index']);
    Route::get('/conversations/{id}/messages',                         [\App\Http\Controllers\Tutor\MessageController::class, 'messages']);
    Route::post('/conversations/{id}/messages',                        [\App\Http\Controllers\Tutor\MessageController::class, 'send']);
    Route::post('/conversations/{id}/accept',                          [\App\Http\Controllers\Tutor\MessageController::class, 'accept']);
    Route::post('/conversations/{id}/reject',                          [\App\Http\Controllers\Tutor\MessageController::class, 'reject']);
    Route::post('/conversations/{id}/propose-date',                    [\App\Http\Controllers\Tutor\MessageController::class, 'proposeDate']);
    Route::post('/conversations/{id}/confirm-date',                    [\App\Http\Controllers\Tutor\MessageController::class, 'confirmDate']);
    Route::post('/conversations/{id}/set-lesson-type',                 [\App\Http\Controllers\Tutor\MessageController::class, 'setLessonType']);
    Route::post('/conversations/{id}/generate-payment-link',           [\App\Http\Controllers\Tutor\MessageController::class, 'generatePaymentLink']);
    Route::post('/conversations/{id}/mark-read',                       [\App\Http\Controllers\Tutor\MessageController::class, 'markRead']);
});

// ─── Student Routes (Authenticated + Role: student) ───
Route::prefix('student')->middleware(['auth:sanctum', 'role:student|tutor'])->group(function () {

    // ── Profile ──
    Route::get('/profile',                  [\App\Http\Controllers\Student\ProfileController::class, 'show']);
    Route::put('/profile',                  [\App\Http\Controllers\Student\ProfileController::class, 'update']);
    Route::post('/profile/avatar',          [\App\Http\Controllers\Student\ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/change-password', [\App\Http\Controllers\Student\ProfileController::class, 'changePassword']);

    Route::post('/bookings', [\App\Http\Controllers\Student\BookingController::class, 'store']);
    Route::get('/bookings', [\App\Http\Controllers\Student\BookingController::class, 'index']);
    Route::put('/bookings/{id}/cancel', [\App\Http\Controllers\Student\BookingController::class, 'cancel']);
    Route::get('/dashboard/stats', [\App\Http\Controllers\Student\DashboardController::class, 'stats']);

    // ── Reviews ──
    Route::post('/reviews', [\App\Http\Controllers\Student\ReviewController::class, 'store']);

    // ── Sessions ──
    Route::get('/sessions', [\App\Http\Controllers\Student\SessionController::class, 'index']);
    Route::get('/sessions/{id}', [\App\Http\Controllers\Student\SessionController::class, 'show']);
    Route::post('/sessions/{id}/dispute', [\App\Http\Controllers\Student\SessionController::class, 'dispute']);

    // ── Mock Payment ──
    Route::post('/bookings/{id}/pay', [\App\Http\Controllers\Student\PaymentController::class, 'pay']);
    Route::get('/bookings/{id}/payment-status', [\App\Http\Controllers\Student\PaymentController::class, 'status']);

    // ── Conversations / Messaging ──
    Route::get('/conversations',                                       [\App\Http\Controllers\Student\MessageController::class, 'index']);
    Route::get('/conversations/{id}/messages',                         [\App\Http\Controllers\Student\MessageController::class, 'messages']);
    Route::post('/conversations/{id}/messages',                        [\App\Http\Controllers\Student\MessageController::class, 'send']);
    Route::post('/conversations/{id}/propose-date',                    [\App\Http\Controllers\Student\MessageController::class, 'proposeDate']);
    Route::post('/conversations/{id}/confirm-date',                    [\App\Http\Controllers\Student\MessageController::class, 'confirmDate']);
    Route::post('/conversations/{id}/mark-read',                       [\App\Http\Controllers\Student\MessageController::class, 'markRead']);

    // Group Sessions
    Route::get('/group-sessions', [\App\Http\Controllers\Student\GroupSessionController::class, 'index']);
    Route::post('/group-sessions/{id}/enroll', [\App\Http\Controllers\Student\GroupSessionController::class, 'enroll']);
    Route::put('/group-sessions/{id}/cancel', [\App\Http\Controllers\Student\GroupSessionController::class, 'cancel']);
});

// ─── Admin Routes (Authenticated + Role: admin) ───
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/dashboard/stats', [\App\Http\Controllers\Admin\DashboardController::class, 'stats']);
    Route::get('/dashboard/chart', [\App\Http\Controllers\Admin\DashboardController::class, 'chart']);

    // Verification Management
    Route::get('/verifications', [\App\Http\Controllers\Admin\VerificationController::class, 'index']);
    Route::get('/verifications/{id}/file', [\App\Http\Controllers\Admin\VerificationController::class, 'viewFile']);
    Route::put('/verifications/{id}/approve', [\App\Http\Controllers\Admin\VerificationController::class, 'approve']);
    Route::put('/verifications/{id}/reject', [\App\Http\Controllers\Admin\VerificationController::class, 'reject']);

    // User Management
    Route::post('/users/bulk', [\App\Http\Controllers\Admin\UserController::class, 'bulkAction']);
    Route::get('/users/export', [\App\Http\Controllers\Admin\UserController::class, 'export']);
    Route::put('/users/{id}/toggle-active', [\App\Http\Controllers\Admin\UserController::class, 'toggleActive']);
    Route::post('/users/{id}/impersonate', [\App\Http\Controllers\Admin\UserController::class, 'impersonate']);
    Route::get('/users/{id}/activity', [\App\Http\Controllers\Admin\UserController::class, 'activity']);
    Route::apiResource('/users', \App\Http\Controllers\Admin\UserController::class);

    // Subject Management
    Route::apiResource('/subjects', \App\Http\Controllers\Admin\SubjectController::class);
    Route::apiResource('/categories', \App\Http\Controllers\Admin\CategoryController::class);

    // ── Platform Settings ──
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index']);
    Route::put('/settings/{key}', [\App\Http\Controllers\Admin\SettingsController::class, 'update']);

    // ── Disputes ──
    Route::get('/disputes', [\App\Http\Controllers\Admin\DisputeController::class, 'index']);
    Route::get('/disputes/{id}', [\App\Http\Controllers\Admin\DisputeController::class, 'show']);
    Route::put('/disputes/{id}/resolve', [\App\Http\Controllers\Admin\DisputeController::class, 'resolve']);

    // ── Sessions Overview ──
    Route::get('/sessions/financials', [\App\Http\Controllers\Admin\SessionController::class, 'financials']);
    Route::get('/sessions',            [\App\Http\Controllers\Admin\SessionController::class, 'index']);
    Route::get('/sessions/{id}',       [\App\Http\Controllers\Admin\SessionController::class, 'show']);
});
