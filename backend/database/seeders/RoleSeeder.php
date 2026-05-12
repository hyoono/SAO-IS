<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RoleSeeder extends Seeder
{
    /**
     * Canonical role list for SAO-IS.
     */
    private const ROLES = [
        'admin',
        'staff',
        'org_officer',
        'student',
        'faculty',
        'director',
        'center_head',
    ];

    /**
     * Roles are stored as an enum on users.role, so this seeder validates
     * existing data instead of inserting rows into a separate roles table.
     */
    public function run(): void
    {
        $invalidRoleCount = DB::table('users')
            ->whereNotIn('role', self::ROLES)
            ->count();

        if ($invalidRoleCount > 0) {
            throw new RuntimeException('Invalid role value(s) found in users table.');
        }
    }
}