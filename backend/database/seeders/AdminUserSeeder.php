<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default admin user.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => '2022jfevasco@live.mcl.edu.ph'],
            [
                'name' => 'Joshua Evasco',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'admin',
            ]
        );
    }
}
