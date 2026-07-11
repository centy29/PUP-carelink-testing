<?php

namespace App\Http\Controllers\Api\Kiosk;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentCheckin;
use App\Models\QrCode;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class CheckinController extends Controller
{
    public function verifyQR(Request $request)
    {
        $request->validate(['qr_hash' => 'required|string']);

        $qrCode = QrCode::where('qr_code_hash', $request->qr_hash)
            ->where('is_active', true)->first();

        if (!$qrCode) {
            return response()->json(['success' => false, 'message' => 'Invalid QR code'], 404);
        }

        $student = User::with('studentProfile')->find($qrCode->user_id);

        // Find today's approved appointment
        $appointment = Appointment::where('user_id', $student->id)
            ->where('status', 'approved')
            ->whereDate('appointment_date', Carbon::today())
            ->first();

        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'No approved appointment for today'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->first_name . ' ' . $student->last_name,
                    'student_id' => $student->student_id,
                    'course' => $student->studentProfile->course ?? 'N/A',
                    'year' => $student->studentProfile->year ?? 'N/A',
                    'section' => $student->studentProfile->section ?? 'N/A',
                ],
                'appointment' => [
                    'id' => $appointment->id,
                    'service' => $appointment->service,
                    'time_slot' => $appointment->time_slot,
                ]
            ]
        ]);
    }

    public function checkin(Request $request)
    {
        $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'user_id' => 'required|exists:users,id',
            'chief_complaint' => 'nullable|string',
        ]);

        $checkin = AppointmentCheckin::create([
            'appointment_id' => $request->appointment_id,
            'user_id' => $request->user_id,
            'checked_in_at' => now(),
            'chief_complaint' => $request->chief_complaint,
            'checkin_status' => 'confirmed',
        ]);

        return response()->json([
            'success' => true,
            'data' => $checkin,
            'message' => 'Check-in successful! Please wait for the nurse.'
        ], 201);
    }

    public function todayCheckins()
    {
        $checkins = AppointmentCheckin::with('user:id,first_name,last_name,student_id')
            ->whereDate('checked_in_at', Carbon::today())
            ->orderBy('checked_in_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $checkins]);
    }

    public function getAppointment($reference)
    {
        $appointment = Appointment::where('reference_number', $reference)
            ->with('user.studentProfile')->first();

        if (!$appointment) {
            return response()->json(['success' => false, 'message' => 'Appointment not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $appointment]);
    }
}