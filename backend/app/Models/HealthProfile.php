<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class HealthProfile extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (!$model->getKey()) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'user_id',
        'emergency_name', 'emergency_relationship', 'emergency_phone',
        'medical_history', 'allergy_details', 'other_medical_history', 'medications',
        'hospitalized', 'hospitalization_date', 'hospitalization_diagnosis',
        'surgery', 'surgery_date', 'surgery_diagnosis',
        'had_covid', 'covid_date', 'covid_diagnosis',
        'occupation', 'marital_status',
        'tobacco_use', 'tobacco_amount', 'tobacco_duration',
        'alcohol_use', 'other_substance_use',
        'has_disability', 'disability_details',
        'last_menstrual_period', 'has_children', 'number_of_children',
        'age_first_pregnancy', 'gravidity', 'term', 'premature',
        'abortion', 'living_children',
        'family_history',
        'consent_signature', 'agree_privacy', 'agree_terms', 'consent_date',
        'completed_at',
    ];

    protected $casts = [
        'medical_history' => 'array',
        'family_history' => 'array',
        'hospitalized' => 'boolean',
        'surgery' => 'boolean',
        'had_covid' => 'boolean',
        'has_disability' => 'boolean',
        'has_children' => 'boolean',
        'gravidity' => 'boolean',
        'term' => 'boolean',
        'premature' => 'boolean',
        'abortion' => 'boolean',
        'living_children' => 'boolean',
        'agree_privacy' => 'boolean',
        'agree_terms' => 'boolean',
        'hospitalization_date' => 'date',
        'surgery_date' => 'date',
        'covid_date' => 'date',
        'last_menstrual_period' => 'date',
        'consent_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}