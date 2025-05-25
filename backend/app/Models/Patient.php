<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
    'user_id',
    'name', 'age', 'gender', 'medical_history', 'medications', 'remarks',
    'insulin_regimen_type', 'fvg', 'fvg_1', 'fvg_2', 'fvg_3',
    'hba1c_1st_visit', 'hba1c_2nd_visit', 'hba1c_3rd_visit',
    'first_visit_date', 'second_visit_date', 'third_visit_date',
    'egfr', 'dds_1', 'dds_3',
    // Derived fields
    'avg_fvg_1_2', 'fvg_delta_1_2',
    'reduction_a', 'reduction_a_per_day',
    'gap_from_initial_visit', 'gap_from_first_clinical_visit',
    'dds_trend_1_3'
];
}
