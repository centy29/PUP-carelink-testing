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
     * Look up student by Student ID or QR hash
     */
    public function lookup(Request $request)
    {
        try {
            $request->validate([
                'student_id' => 'required|string',
                'qr_hash' => 'nullable|string',
            ]);

            $identifier = trim((string) $request->student_id);
            $qrHash = $request->input('qr_hash') ? trim((string) $request->input('qr_hash')) : null;

            // Debug log
            \Log::info('Kiosk lookup request', [
                'identifier' => $identifier,
                'qr_hash' => $qrHash,
            ]);

            $user = null;

            // 1. Try exact match by student_id
            $user = User::where('student_id', $identifier)
                ->with(['studentProfile', 'healthProfile', 'qrCode'])
                ->first();

            // 2. If not found, try by identifier as qr_code_hash
            if (!$user) {
                $user = User::whereHas('qrCode', function ($q) use ($identifier) {
                    $q->where('qr_code_hash', $identifier)->where('is_active', true);
                })->with(['studentProfile', 'healthProfile', 'qrCode'])->first();
            }

            // 3. If qr_hash is provided and different, try by qr_hash
            if (!$user && $qrHash && $qrHash !== $identifier) {
                $user = User::whereHas('qrCode', function ($q) use ($qrHash) {
                    $q->where('qr_code_hash', $qrHash)->where('is_active', true);
                })->with(['studentProfile', 'healthProfile', 'qrCode'])->first();
            }

            // 4. Fallback: tolerate formatting differences (case, dashes, spaces)
            if (!$user && strlen($identifier) >= 5) {
                $normalized = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($identifier));
                
                // Get all users and their qr codes, then filter in PHP
                $users = User::with(['studentProfile', 'healthProfile', 'qrCode'])->get();
                
                foreach ($users as $potentialUser) {
                    // Check normalized student_id
                    $normalizedStudentId = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($potentialUser->student_id));
                    if ($normalizedStudentId === $normalized) {
                        $user = $potentialUser;
                        break;
                    }
                    
                    // Check normalized qr_code_hash
                    if ($potentialUser->qrCode && $potentialUser->qrCode->is_active) {
                        $normalizedQrHash = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($potentialUser->qrCode->qr_code_hash));
                        if ($normalizedQrHash === $normalized) {
                            $user = $potentialUser;
                            break;
                        }
                    }
                }
            }

            // 5. If still not found and qr_hash provided, try normalized qr_hash
            if (!$user && $qrHash) {
                $normalizedQrHash = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($qrHash));
                $users = User::with(['studentProfile', 'healthProfile', 'qrCode'])->get();
                
                foreach ($users as $potentialUser) {
                    if ($potentialUser->qrCode && $potentialUser->qrCode->is_active) {
                        $normalizedDbHash = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($potentialUser->qrCode->qr_code_hash));
                        if ($normalizedDbHash === $normalizedQrHash) {
                            $user = $potentialUser;
                            break;
                        }
                    }
                }
            }

            if (!$user) {
                \Log::info('Kiosk lookup: Student not found', [
                    'identifier' => $identifier,
                    'qr_hash' => $qrHash,
                ]);
                return response()->json([
                    'success' => false, 
                    'message' => 'Student not found. Please check your Student ID or QR code.'
                ], 404);
            }

            // Find today's appointment
            $appointment = Appointment::where('user_id', $user->id)
                ->whereDate('appointment_date', now())
                ->where('status', 'approved')
                ->first();

            // Find active check-in (use checkin_status column)
            $activeCheckin = AppointmentCheckin::where('user_id', $user->id)
                ->whereDate('created_at', now())
                ->where('checkin_status', '!=', 'completed')
                ->first();

            \Log::info('Kiosk lookup: Student found', [
                'user_id' => $user->id,
                'student_id' => $user->student_id,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'appointment' => $appointment,
                    'has_active_checkin' => !is_null($activeCheckin),
                    'active_checkin' => $activeCheckin,
                ]
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Kiosk lookup error: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage(),
            ], 500);
        }
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
            ->where('checkin_status', '!=', 'completed')
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
            'checkin_status' => 'confirmed',
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
            ->where('checkin_status', '!=', 'completed')
            ->orderByRaw("CASE WHEN queue_type = 'priority' THEN 0 ELSE 1 END")
            ->orderBy('check_in_time')
            ->get();

        $nowServing = AppointmentCheckin::with('user')
            ->whereDate('created_at', now())
            ->where('checkin_status', 'confirmed')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'now_serving' => $nowServing,
                'queue' => $queue,
                'total_waiting' => $queue->where('checkin_status', 'confirmed')->count(),
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
            ->where('checkin_status', 'confirmed')
            ->update(['checkin_status' => 'completed']);

        // Get next in queue (priority first)
        $next = AppointmentCheckin::with('user')
            ->whereDate('created_at', now())
            ->where('checkin_status', 'confirmed')
            ->orderByRaw("CASE WHEN queue_type = 'priority' THEN 0 ELSE 1 END")
            ->orderBy('check_in_time')
            ->first();

        if ($next) {
            $next->update(['checkin_status' => 'completed']);
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