<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    public function run()
    {
        if (User::where('email', 'nurse@pupbc.edu.ph')->exists()) {
            $this->command->info('Admin already exists.');
            return;
        }

        User::create([
            'id' => Str::uuid(),
            'student_id' => 'ADMIN-001',
            'first_name' => 'Nurse',
            'last_name' => 'Admin',
            'email' => 'nurse@pupbc.edu.ph',
            'password' => bcrypt('Nurse@123'),
            'role' => 'admin',
            'birthday' => '1990-01-01',
            'gender' => 'Female',
            'course' => 'N/A',
            'year' => 'N/A',
            'section' => 'N/A',
            'mobile_number' => '09123456789',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $this->command->info('Admin created: nurse@pupbc.edu.ph / Nurse@123');
    }
}