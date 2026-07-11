<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Consultation;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $userId = auth()->id();
        
        return response()->json([
            'success' => true,
            'data' => [
                'upcoming_appointments' => Appointment::where('user_id', $userId)
                    ->where('appointment_date', '>=', now())
                    ->where('status', 'approved')
                    ->count(),
                'total_consultations' => Consultation::where('user_id', $userId)->count(),
                'medical_certificates' => 0,
                'pending_appointments' => Appointment::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->count(),
            ]
        ]);
    }

    public function upcomingAppointments()
    {
        $appointments = Appointment::where('user_id', auth()->id())
            ->where('appointment_date', '>=', now())
            ->where('status', 'approved')
            ->orderBy('appointment_date')
            ->limit(5)
            ->get();

        return response()->json(['success' => true, 'data' => $appointments]);
    }

    public function recentConsultations()
    {
        $consultations = Consultation::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json(['success' => true, 'data' => $consultations]);
    }
}