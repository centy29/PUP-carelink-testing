<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\HealthProfile;
use Illuminate\Http\Request;

class HealthProfileController extends Controller
{
    public function show()
    {
        $profile = HealthProfile::where('user_id', auth()->id())->first();
        return response()->json(['success' => true, 'data' => $profile]);
    }

    public function checkStatus()
    {
        $profile = HealthProfile::where('user_id', auth()->id())->first();
        return response()->json([
            'success' => true,
            'data' => [
                'exists' => !is_null($profile),
                'completed' => !is_null($profile),
            ]
        ]);
    }

    public function store(Request $request)
    {
        $existing = HealthProfile::where('user_id', auth()->id())->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Health profile already exists. Use update instead.'], 400);
        }

        $profile = new HealthProfile();
        $profile->user_id = auth()->id();
        $profile->completed_at = now();
        $this->fillProfile($profile, $request);
        $profile->save();

        return response()->json(['success' => true, 'message' => 'Health profile created.', 'data' => $profile], 201);
    }

    public function update(Request $request)
    {
        $profile = HealthProfile::where('user_id', auth()->id())->first();
        if (!$profile) {
            return response()->json(['success' => false, 'message' => 'Health profile not found.'], 404);
        }

        $this->fillProfile($profile, $request);
        $profile->save();

        return response()->json(['success' => true, 'message' => 'Health profile updated.', 'data' => $profile->fresh()]);
    }

    private function fillProfile($profile, Request $request)
    {
        // Map frontend field names to database columns
        $mappings = [
            // Emergency Contact
            'emergency_contact_name' => 'emergency_name',
            'emergency_contact_relationship' => 'emergency_relationship',
            'emergency_contact_phone' => 'emergency_phone',
            'emergency_name' => 'emergency_name',
            'emergency_relationship' => 'emergency_relationship',
            'emergency_phone' => 'emergency_phone',
            
            // Medical History
            'medical_history' => 'medical_history',
            'allergy_details' => 'allergy_details',
            'other_medical_history' => 'other_medical_history',
            'medications' => 'medications',
            
            // Hospitalization, Surgery, COVID
            'hospitalized' => 'hospitalized',
            'hospitalization_date' => 'hospitalization_date',
            'hospitalization_diagnosis' => 'hospitalization_diagnosis',
            'surgery' => 'surgery',
            'surgery_date' => 'surgery_date',
            'surgery_diagnosis' => 'surgery_diagnosis',
            'had_covid' => 'had_covid',
            'covid_date' => 'covid_date',
            'covid_diagnosis' => 'covid_diagnosis',
            
            // Personal & Social History
            'occupation' => 'occupation',
            'marital_status' => 'marital_status',
            'tobacco_use' => 'tobacco_use',
            'tobacco_amount' => 'tobacco_amount',
            'tobacco_duration' => 'tobacco_duration',
            'alcohol_use' => 'alcohol_use',
            'other_substance_use' => 'other_substance_use',
            'has_disability' => 'has_disability',
            'disability_details' => 'disability_details',
            
            // Female-only
            'last_menstrual_period' => 'last_menstrual_period',
            'has_children' => 'has_children',
            'number_of_children' => 'number_of_children',
            'age_first_pregnancy' => 'age_first_pregnancy',
            'gravidity' => 'gravidity',
            'term' => 'term',
            'premature' => 'premature',
            'abortion' => 'abortion',
            'living_children' => 'living_children',
            
            // Family History
            'family_history' => 'family_history',
            
            // Consent
            'consent_signature' => 'consent_signature',
            'agree_privacy' => 'agree_privacy',
            'agree_terms' => 'agree_terms',
            'consent_date' => 'consent_date',
        ];

        foreach ($mappings as $requestKey => $dbColumn) {
            if ($request->has($requestKey)) {
                $value = $request->$requestKey;
                
                // JSON encode arrays
                if (in_array($dbColumn, ['medical_history', 'family_history']) && is_array($value)) {
                    $value = json_encode($value);
                }
                
                $profile->$dbColumn = $value;
            }
        }

        return $profile;
    }
}