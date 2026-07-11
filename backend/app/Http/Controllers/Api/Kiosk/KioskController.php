<?php

namespace App\Http\Controllers\Api\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentCheckin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class KioskController extends Controller
{
    /**
     * Look up student by Student ID
     */
    public function lookup(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string'
        ]);

        $user = User::where('student_id', $request->student_id)
            ->with(['studentProfile', 'healthProfile', 'qrCode'])
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'Student not found.'
            ], 404);
        }

        // Find today's appointment
        $appointment = Appointment::where('user_id', $user->id)
            ->whereDate('appointment_date', now())
            ->where('status', 'approved')
            ->first();

        // Find active check-in
        $activeCheckin = AppointmentCheckin::where('user_id', $user->id)
            ->whereDate('created_at', now())
            ->where('status', '!=', 'completed')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'appointment' => $appointment,
                'has_active_checkin' => !is_null($activeCheckin),
                'active_checkin' => $activeCheckin,
            ]
        ]);
    }

    /**
     * Check-in student + auto-triage
     */
    public function checkin(Request $request)
    {
        $request->validate([
            'student_id' => 'required|string',
            'reason' => 'nullable|string|max:500',
            'is_walk_in' => 'boolean',
        ]);

        $user = User::where('student_id', $request->student_id)
            ->with('healthProfile')
            ->first();

        if (!$user) {
            return response()->json([
                'success' => false, 
                'message' => 'Student not found.'
            ], 404);
        }

        // Check if already checked in today
        $existingCheckin = AppointmentCheckin::where('user_id', $user->id)
            ->whereDate('created_at', now())
            ->where('status', '!=', 'completed')
            ->first();

        if ($existingCheckin) {
            return response()->json([
                'success' => true,
                'message' => 'Already checked in.',
                'data' => $existingCheckin
            ]);
        }

        // Find appointment
        $appointment = Appointment::where('user_id', $user->id)
            ->whereDate('appointment_date', now())
            ->where('status', 'approved')
            ->first();

        // Auto-triage
        $queueType = $this->triagePriority($user, $request->reason);
        $queueNumber = $this->generateQueueNumber($queueType);

        // Create check-in
        $checkin = AppointmentCheckin::create([
            'appointment_id' => $appointment ? $appointment->id : null,
            'user_id' => $user->id,
            'queue_number' => $queueNumber,
            'queue_type' => $queueType,
            'triage_reason' => $request->reason,
            'is_walk_in' => (!$appointment || $request->is_walk_in),
            'status' => 'waiting',
            'check_in_time' => now(),
        ]);

        // Update appointment if exists
        if ($appointment) {
            $appointment->update([
                'checked_in_at' => now(),
                'queue_number' => $queueNumber,
                'queue_type' => $queueType,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Check-in successful!',
            'data' => $checkin->load('user'),
        ], 201);
    }

    /**
     * Get today's queue
     */
    public function todayQueue()
    {
        $queue = AppointmentCheckin::with('user')
            ->whereDate('created_at', now())
            ->where('status', '!=', 'completed')
            ->orderByRaw("FIELD(queue_type, 'priority', 'regular')")
            ->orderBy('check_in_time')
            ->get();

        $nowServing = AppointmentCheckin::with('user')
            ->whereDate('created_at', now())
            ->where('status', 'serving')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'now_serving' => $nowServing,
                'queue' => $queue,
                'total_waiting' => $queue->where('status', 'waiting')->count(),
            ]
        ]);
    }

    /**
     * Nurse: Call next patient
     */
    public function callNext()
    {
        // Mark current serving as completed
        AppointmentCheckin::whereDate('created_at', now())
            ->where('status', 'serving')
            ->update(['status' => 'completed']);

        // Get next in queue (priority first)
        $next = AppointmentCheckin::with('user')
            ->whereDate('created_at', now())
            ->where('status', 'waiting')
            ->orderByRaw("FIELD(queue_type, 'priority', 'regular')")
            ->orderBy('check_in_time')
            ->first();

        if ($next) {
            $next->update(['status' => 'serving']);
            return response()->json([
                'success' => true,
                'data' => $next->load('user')
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'No more patients in queue.'
        ]);
    }

    /**
     * Auto-triage: Determine priority based on reason + health profile
     */
    private function triagePriority($user, $reason)
    {
        // Emergency keywords
        $emergencyKeywords = [
            'emergency', 'urgent', 'severe', 'bleeding', 'accident', 
            'chest pain', 'difficulty breathing', 'fever', 'vomiting', 'diarrhea'
        ];
        
        foreach ($emergencyKeywords as $keyword) {
            if ($reason && stripos($reason, $keyword) !== false) {
                return 'priority';
            }
        }

        $healthProfile = $user->healthProfile;
        
        if ($healthProfile) {
            // PWD
            if ($healthProfile->has_disability) return 'priority';
            
            // Pregnant
            if ($healthProfile->gravidity || $healthProfile->has_children) return 'priority';
            
            // Serious conditions
            $seriousConditions = [
                'Heart Disease', 'Diabetes Mellitus', 'Hypertension', 
                'Kidney Disease', 'Bronchial Asthma', 'Tuberculosis'
            ];
            
            $medicalHistory = json_decode($healthProfile->medical_history, true) ?? [];
            
            foreach ($seriousConditions as $condition) {
                if (in_array($condition, $medicalHistory)) return 'priority';
            }
        }

        return 'regular';
    }

    /**
     * Generate queue number
     */
    private function generateQueueNumber($type)
    {
        $prefix = $type === 'priority' ? 'P' : 'R';
        $count = AppointmentCheckin::whereDate('created_at', now())
            ->where('queue_type', $type)
            ->count();
        
        return $prefix . '-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    }
}