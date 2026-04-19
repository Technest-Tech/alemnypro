<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TutorProfile;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->filled('role'), fn ($q) => $q->byRole($request->role))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($sq) use ($request) {
                    $sq->where('name', 'ilike', "%{$request->search}%")
                       ->orWhere('email', 'ilike', "%{$request->search}%")
                       ->orWhere('phone', 'ilike', "%{$request->search}%");
                });
            })
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->filled('status') && $request->status !== 'all', function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active');
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return $this->success($users);
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with(['tutorProfile', 'studentProfile'])->findOrFail($id);
        return $this->success($user);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'unique:users,phone'],
            'password' => ['required', Password::min(8)],
            'role' => ['required', 'in:student,tutor,admin'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
            'locale' => 'ar'
        ]);

        $user->assignRole($validated['role']);

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

        return $this->created($user, 'User created successfully');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', Password::min(8)],
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return $this->success($user, 'User updated successfully');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return $this->error('Cannot delete yourself', 422);
        }

        $user->delete();

        return $this->success(null, 'User deleted successfully');
    }

    public function toggleActive(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return $this->error('Cannot deactivate yourself', 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return $this->success([
            'id' => $user->id,
            'is_active' => $user->is_active,
        ], $user->is_active ? 'User activated' : 'User suspended');
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:users,id'],
            'action' => ['required', 'in:activate,suspend,delete']
        ]);

        $ids = array_filter($validated['ids'], fn($id) => $id !== $request->user()->id);

        if (empty($ids)) {
            return $this->error('No valid users selected (cannot target yourself)', 422);
        }

        if ($validated['action'] === 'activate') {
            User::whereIn('id', $ids)->update(['is_active' => true]);
        } elseif ($validated['action'] === 'suspend') {
            User::whereIn('id', $ids)->update(['is_active' => false]);
        } elseif ($validated['action'] === 'delete') {
            User::whereIn('id', $ids)->delete();
        }

        return $this->success(null, 'Bulk action completed successfully');
    }

    public function export(Request $request)
    {
        $query = User::query()
            ->when($request->filled('role'), fn ($q) => $q->byRole($request->role))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($sq) use ($request) {
                    $sq->where('name', 'ilike', "%{$request->search}%")
                       ->orWhere('email', 'ilike', "%{$request->search}%")
                       ->orWhere('phone', 'ilike', "%{$request->search}%");
                });
            })
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->filled('status') && $request->status !== 'all', function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active');
            })
            ->orderBy('created_at', 'desc');

        $users = $query->lazy();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="users_export.csv"',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Wallet Balance', 'Joined At']);

            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->phone,
                    $user->role,
                    $user->is_active ? 'Active' : 'Suspended',
                    $user->wallet_balance ?? 0,
                    $user->created_at->format('Y-m-d H:i:s'),
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function impersonate(Request $request, int $id): JsonResponse
    {
        $targetUser = User::findOrFail($id);

        if ($targetUser->id === $request->user()->id) {
            return $this->error('Cannot impersonate yourself', 422);
        }

        if ($targetUser->role === 'admin') {
            return $this->error('Cannot impersonate other admins', 403);
        }

        // Issue a specific token for impersonation
        $token = $targetUser->createToken('auth-token')->plainTextToken;

        $userData = [
            'id'     => $targetUser->id,
            'name'   => $targetUser->name,
            'email'  => $targetUser->email,
            'phone'  => $targetUser->phone,
            'role'   => $targetUser->role,
            'locale' => $targetUser->locale,
            'avatar' => $targetUser->avatar,
        ];

        return $this->success([
            'user' => $userData,
            'token' => $token,
        ], 'Impersonation session started');
    }

    public function activity(int $id): JsonResponse
    {
        // Check if relationships exist to avoid crashing
        $with = [];
        if (method_exists(User::class, 'walletTransactions')) $with[] = 'walletTransactions';
        if (method_exists(User::class, 'groupSessions')) $with[] = 'groupSessions';
        if (method_exists(User::class, 'groupEnrollments')) $with[] = 'groupEnrollments.groupSession';
        
        $user = User::with($with)->findOrFail($id);
        
        $activities = collect();

        if ($user->role === 'tutor' && method_exists($user, 'groupSessions')) {
            foreach ($user->groupSessions as $gs) {
                $activities->push([
                    'type' => 'group_session_created',
                    'title' => 'Created Group Session',
                    'description' => "Created session '{$gs->title}'",
                    'date' => $gs->created_at,
                ]);
            }
        } elseif ($user->role === 'student' && method_exists($user, 'groupEnrollments')) {
            foreach ($user->groupEnrollments as $en) {
                $title = $en->groupSession ? $en->groupSession->title : 'Unknown Session';
                $activities->push([
                    'type' => 'group_session_enrolled',
                    'title' => 'Enrolled in Session',
                    'description' => "Enrolled in '{$title}'",
                    'date' => $en->created_at,
                ]);
            }
        }

        if (method_exists($user, 'walletTransactions')) {
            foreach ($user->walletTransactions as $wt) {
                $activities->push([
                    'type' => 'wallet_transaction',
                    'title' => $wt->amount > 0 ? 'Wallet Credited' : 'Wallet Debited',
                    'description' => strtoupper($wt->type) . " of {$wt->amount} (" . ($wt->description ?? 'No desc') . ")",
                    'date' => $wt->created_at,
                ]);
            }
        }

        // Add base account creation event
        $activities->push([
            'type' => 'account_created',
            'title' => 'Account Created',
            'description' => 'User joined platform',
            'date' => $user->created_at,
        ]);

        $sortedActivities = $activities->sortByDesc('date')->values();

        return $this->success($sortedActivities);
    }
}
