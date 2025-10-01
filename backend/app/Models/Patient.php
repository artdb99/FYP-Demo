<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
    'user_id',
    'assigned_doctor_id',
    'name', 'age', 'gender', 'medical_history', 'medications', 'remarks',
    'insulin_regimen_type', 'fvg', 'fvg_1', 'fvg_2', 'fvg_3',
    'hba1c_1st_visit', 'hba1c_2nd_visit', 'hba1c_3rd_visit',
    'first_visit_date', 'second_visit_date', 'third_visit_date',
    'egfr', 'dds_1', 'dds_3', 'height_cm', 'weight_kg', 'physical_activity',
    // Derived fields
    'avg_fvg_1_2', 'fvg_delta_1_2',
    'reduction_a', 'reduction_a_per_day',
    'reduction_a_2_3',
    'gap_from_initial_visit', 'gap_from_first_clinical_visit',
    'dds_trend_1_3'
];

  protected $casts = [
        'height_cm' => 'float',
        'weight_kg' => 'float',
    ];

    // Include computed fields in API JSON responses
    protected $appends = ['bmi', 'bmi_category'];

    public function getBmiAttribute()
    {
        if (!$this->height_cm || !$this->weight_kg) return null;
        $m = $this->height_cm / 100;
        if ($m <= 0) return null;
        return round($this->weight_kg / ($m * $m), 1); // 1 decimal place
    }

    public function getBmiCategoryAttribute()
    {
        $bmi = $this->bmi;
        if ($bmi === null) return null;

        if ($bmi < 18.5) return 'Underweight';
        if ($bmi < 25)   return 'Normal';
        if ($bmi < 30)   return 'Overweight';
        return 'Obese';
    }

    public function assignedDoctor()
    {
        return $this->belongsTo(User::class, 'assigned_doctor_id');
    }
}
