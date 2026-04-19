<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['student', 'tutor', 'parent', 'admin'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@alemnypro.com'],
            [
                'name' => 'AlemnyPro Admin',
                'phone' => '01000000000',
                'password' => Hash::make('Admin@123!'),
                'role' => 'admin',
                'locale' => 'ar',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $admin->assignRole('admin');
    }
}
