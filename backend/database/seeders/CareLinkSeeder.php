<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\HealthProfile;
use App\Models\Appointment;
use App\Models\Consultation;
use App\Models\Notification;
use App\Models\QrCode;
use Illuminate\Support\Str;
use Carbon\Carbon;

class CareLinkSeeder extends Seeder
{
    public function run()
    {
        // CREATE NURSE ACCOUNT
        $nurse = User::create([
            'id' => (string) Str::uuid(),
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'nurse@pupbc.edu.ph',
            'password' => bcrypt('password123'),
            'role' => 'nurse',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        echo "Nurse created: nurse@pupbc.edu.ph / password123\n";

        // CREATE TEST STUDENT
        $user = User::create([
            'id' => (string) Str::uuid(),
            'student_id' => '2021-00001-BN-0',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'email' => 'juan@example.com',
            'password' => bcrypt('password123'),
            'role' => 'student',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        StudentProfile::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'course' => 'BSIT',
            'year' => '3',
            'section' => 'A',
            'birthday' => '2002-05-15',
            'gender' => 'male',
            'mobile_number' => '09123456789',
        ]);

        HealthProfile::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'allergies' => 'None',
            'agree_privacy' => true,
            'agree_terms' => true,
            'completed_at' => now(),
        ]);

        QrCode::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'qr_code_hash' => (string) Str::uuid(),
            'is_active' => true,
        ]);

        Appointment::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'service' => 'General Checkup',
            'appointment_date' => Carbon::tomorrow(),
            'time_slot' => '9:00 AM - 10:00 AM',
            'concern' => 'Regular checkup',
            'status' => 'pending',
            'reference_number' => 'APT-' . strtoupper(Str::random(10)),
        ]);

        echo "Student created: juan@example.com / password123\n";
        echo "Seeding complete!\n";
    }
}