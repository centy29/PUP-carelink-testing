<?php

namespace App\Http\Controllers\Api\Nurse;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Appointment;
use App\Models\Notification;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ConsultationController extends Controller
{
    public function index(Request $request)
    {
        $query = Consultation::with(['user:id,student_id,first_name,last_name', 'nurse:id,first_name,last_name'])
            ->when($request->date, fn($q) => $q->whereDate('created_at', $request->date))
            ->when($request->search, function($q) use ($request) {
                $q->whereHas('user', fn($q) => 
                    $q->where('first_name', 'like', "%{$request->search}%")
                      ->orWhere('last_name', 'like', "%{$request->search}%")
                      ->orWhere('student_id', 'like', "%{$request->search}%")
                );
            })
            ->orderBy('created_at', 'desc');

        return response()->json(['success' => true, 'data' => $query->paginate(20)]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'chief_complaint' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'general_remarks' => 'nullable|string',
            'medical_certificate' => 'boolean',
            'medical_certificate_ref' => 'nullable|string',
            'follow_up_required' => 'boolean',
            'follow_up_date' => 'nullable|date',
        ]);

        DB::beginTransaction();
        try {
            $consultation = Consultation::create([
                'user_id' => $request->user_id,
                'appointment_id' => $request->appointment_id,
                'nurse_id' => auth()->id(),
                'chief_complaint' => $request->chief_complaint,
                'vital_signs' => $request->vital_signs ? json_encode($request->vital_signs) : null,
                'general_remarks' => $request->general_remarks,
                'medical_certificate' => $request->medical_certificate ?? false,
                'medical_certificate_ref' => $request->medical_certificate_ref,
                'follow_up_required' => $request->follow_up_required ?? false,
                'follow_up_date' => $request->follow_up_date,
                'status' => 'completed'
            ]);

            if ($request->appointment_id) {
                Appointment::where('id', $request->appointment_id)->update(['status' => 'completed']);
            }

            Notification::create([
                'user_id' => $request->user_id,
                'type' => 'consultation_completed',
                'title' => 'Consultation Recorded',
                'message' => 'Your consultation has been recorded.',
            ]);

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'consultation_created',
                'description' => "Consultation created for student {$request->user_id}",
                'ip_address' => request()->ip(),
            ]);

            Cache::forget('nurse_dashboard_stats');
            DB::commit();

            return response()->json(['success' => true, 'data' => $consultation, 'message' => 'Consultation saved'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $consultation = Consultation::with(['user.studentProfile', 'user.healthProfile', 'nurse', 'appointment'])->findOrFail($id);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'consultation_viewed',
            'description' => "Viewed consultation record {$id}",
            'ip_address' => request()->ip()
        ]);

        return response()->json(['success' => true, 'data' => $consultation]);
    }

    public function update(Request $request, $id)
    {
        $consultation = Consultation::findOrFail($id);
        $consultation->update($request->only([
            'chief_complaint', 'vital_signs', 'general_remarks',
            'medical_certificate', 'medical_certificate_ref',
            'follow_up_required', 'follow_up_date'
        ]));
        return response()->json(['success' => true, 'data' => $consultation, 'message' => 'Consultation updated']);
    }

    public function todayConsultations()
    {
        $consultations = Consultation::with('user:id,first_name,last_name,student_id')
            ->whereDate('created_at', Carbon::today())->get();
        return response()->json(['success' => true, 'data' => $consultations]);
    }

    public function filterByDate($date)
    {
        $consultations = Consultation::with('user:id,first_name,last_name,student_id')
            ->whereDate('created_at', $date)->get();
        return response()->json(['success' => true, 'data' => $consultations]);
    }
}