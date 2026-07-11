<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    public function index()
    {
        $appointments = Appointment::where('user_id', auth()->id())
            ->orderBy('appointment_date', 'desc')
            ->get();
        return response()->json(['success' => true, 'data' => $appointments]);
    }

    /**
     * Get available slots for a specific date
     */
    public function availableSlots(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $slots = AppointmentSlot::getAvailableSlots($request->date);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $request->date,
                'slots' => $slots,
            ]
        ]);
    }

    /**
     * Check if user already has an appointment on a date
     */
    public function checkDuplicate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $existing = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        return response()->json([
            'success' => true,
            'has_existing' => $existing,
            'message' => $existing ? 'You already have an appointment on this date.' : null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service' => 'required|string',
            'appointment_date' => 'required|date|after_or_equal:today',
            'time_slot' => 'required|string',
            'concern' => 'nullable|string',
        ]);

        // Check for duplicate appointment on same date
        $existingOnDate = Appointment::where('user_id', auth()->id())
            ->whereDate('appointment_date', $request->appointment_date)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existingOnDate) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an appointment on this date. Please choose a different date.',
            ], 422);
        }

        // Check slot availability (max 10 per 30-min slot)
        if (!AppointmentSlot::isSlotAvailable($request->appointment_date, $request->time_slot)) {
            return response()->json([
                'success' => false,
                'message' => 'This time slot is already full (10/10). Please select a different time.',
            ], 422);
        }

        $appointment = Appointment::create([
            'user_id' => auth()->id(),
            'service' => $request->service,
            'appointment_date' => $request->appointment_date,
            'time_slot' => $request->time_slot,
            'concern' => $request->concern,
            'status' => 'pending',
            'reference_number' => 'APT-' . strtoupper(Str::random(8)),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully!',
            'data' => $appointment
        ], 201);
    }

    public function show($id)
    {
        $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);
        return response()->json(['success' => true, 'data' => $appointment]);
    }

    public function cancel($id)
    {
        $appointment = Appointment::where('user_id', auth()->id())->findOrFail($id);
        
        if (!in_array($appointment->status, ['pending', 'approved'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending or approved appointments can be cancelled.',
            ], 422);
        }

        $appointment->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully.',
        ]);
    }
}