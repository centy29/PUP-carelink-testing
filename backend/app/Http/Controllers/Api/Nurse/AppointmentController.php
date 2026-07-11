<?php

namespace App\Http\Controllers\Api\Nurse;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['user:id,student_id,first_name,last_name', 'user.studentProfile'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->date, fn($q) => $q->whereDate('appointment_date', $request->date))
            ->when($request->search, function($q) use ($request) {
                $q->whereHas('user', fn($q) => 
                    $q->where('first_name', 'like', "%{$request->search}%")
                      ->orWhere('last_name', 'like', "%{$request->search}%")
                      ->orWhere('student_id', 'like', "%{$request->search}%")
                );
            })
            ->orderBy('appointment_date', 'desc');

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function show($id)
    {
        $appointment = Appointment::with([
            'user.studentProfile', 'user.healthProfile', 'approvedBy:id,first_name,last_name'
        ])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $appointment]);
    }

    public function approve($id)
    {
        DB::beginTransaction();
        try {
            $appointment = Appointment::findOrFail($id);
            
            if ($appointment->status !== 'pending') {
                return response()->json(['success' => false, 'message' => 'Only pending appointments can be approved'], 400);
            }

            $appointment->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now()
            ]);

            $appointmentDate = Carbon::parse($appointment->appointment_date)->format('M d, Y');

            Notification::create([
                'user_id' => $appointment->user_id,
                'type' => 'appointment_approved',
                'title' => 'Appointment Approved',
                'message' => "Your appointment on {$appointmentDate} at {$appointment->time_slot} has been approved.",
            ]);

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'appointment_approved',
                'description' => "Approved appointment {$appointment->reference_number}",
                'ip_address' => request()->ip(),
            ]);

            Cache::forget('nurse_dashboard_stats');
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Appointment approved']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['reason' => 'required|string|max:500']);

        DB::beginTransaction();
        try {
            $appointment = Appointment::findOrFail($id);
            
            if ($appointment->status !== 'pending') {
                return response()->json(['success' => false, 'message' => 'Only pending appointments can be rejected'], 400);
            }

            $appointment->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason
            ]);

            Notification::create([
                'user_id' => $appointment->user_id,
                'type' => 'appointment_rejected',
                'title' => 'Appointment Rejected',
                'message' => "Your appointment was rejected. Reason: {$request->reason}",
            ]);

            Cache::forget('nurse_dashboard_stats');
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Appointment rejected']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reschedule(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update([
            'appointment_date' => $request->appointment_date,
            'time_slot' => $request->time_slot,
        ]);
        return response()->json(['success' => true, 'message' => 'Appointment rescheduled']);
    }

    /**
     * Complete an appointment - mark as done
     */
    public function complete($id)
    {
        DB::beginTransaction();
        try {
            $appointment = Appointment::findOrFail($id);
            
            if ($appointment->status !== 'approved') {
                return response()->json([
                    'success' => false, 
                    'message' => 'Only approved appointments can be completed'
                ], 400);
            }

            $appointment->update(['status' => 'completed']);

            Cache::forget('nurse_dashboard_stats');
            DB::commit();

            return response()->json([
                'success' => true, 
                'message' => 'Appointment marked as completed'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false, 
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function filterByStatus($status)
    {
        $appointments = Appointment::where('status', $status)
            ->with('user:id,student_id,first_name,last_name')->paginate(20);
        return response()->json(['success' => true, 'data' => $appointments]);
    }

    public function filterByDate($date)
    {
        $appointments = Appointment::whereDate('appointment_date', $date)
            ->with('user:id,student_id,first_name,last_name')->paginate(20);
        return response()->json(['success' => true, 'data' => $appointments]);
    }
}