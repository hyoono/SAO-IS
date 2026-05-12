<?php

namespace Database\Seeders;

use App\Models\Center;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CenterSeeder extends Seeder
{
    /**
     * Seed the 4 SAO centers and demo center_head users.
     */
    public function run(): void
    {
        $centers = [
            ['code' => 'CSAD', 'name' => 'Center for Student Activities and Discipline', 'description' => 'Handles student activity forms, organization registration and renewal.'],
            ['code' => 'CSA',  'name' => 'Center for Student Advising', 'description' => 'Handles student advising reports and data transformation.'],
            ['code' => 'CSFA', 'name' => 'Center for Scholarships and Financial Assistance', 'description' => 'Handles scholarship and financial assistance forms.'],
            ['code' => 'CGC',  'name' => 'Center for Guidance and Counselling', 'description' => 'Handles guidance and counselling forms.'],
        ];

        foreach ($centers as $centerData) {
            Center::updateOrCreate(
                ['code' => $centerData['code']],
                $centerData
            );
        }

        // Director account (system-wide, no center)
        User::updateOrCreate(
            ['email' => 'director@sao-is.local'],
            [
                'name' => 'SAO Director',
                'password_hash' => Hash::make('MMCLSAO2026'),
                'role' => 'director',
                'center_id' => null,
            ]
        );

        // Demo center_head for each center
        $centerHeads = [
            ['email' => 'csad.head@sao-is.local', 'name' => 'CSAD Head', 'center_code' => 'CSAD'],
            ['email' => 'csa.head@sao-is.local',  'name' => 'CSA Head',  'center_code' => 'CSA'],
            ['email' => 'csfa.head@sao-is.local', 'name' => 'CSFA Head', 'center_code' => 'CSFA'],
            ['email' => 'cgc.head@sao-is.local',  'name' => 'CGC Head',  'center_code' => 'CGC'],
        ];

        foreach ($centerHeads as $headData) {
            $center = Center::where('code', $headData['center_code'])->first();
            User::updateOrCreate(
                ['email' => $headData['email']],
                [
                    'name' => $headData['name'],
                    'password_hash' => Hash::make('MMCLSAO2026'),
                    'role' => 'center_head',
                    'center_id' => $center?->id,
                ]
            );
        }
    }
}
