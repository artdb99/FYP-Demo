<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add auth logic if needed
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'age' => 'nullable|integer',
            'gender' => 'required|string',
            'height_cm' => 'nullable|numeric|min:30|max:250',
            'weight_kg' => 'nullable|numeric|min:10|max:400',
            'physical_activity' => 'nullable|string',
            'medicalHistory' => 'nullable|string',
            'medications' => 'nullable|string',
            'remarks' => 'nullable|string',
            'insulinType' => 'nullable|string',
            'fvg' => 'nullable|numeric',
            'fvg_1' => 'nullable|numeric',
            'fvg_2' => 'nullable|numeric',
            'fvg_3' => 'nullable|numeric',
            'hba1c1' => 'nullable|numeric',
            'hba1c2' => 'nullable|numeric',
            'hba1c3' => 'nullable|numeric',
            'egfr' => 'nullable|numeric',
            'dds_1' => 'nullable|numeric',
            'dds_3' => 'nullable|numeric',
            'first_visit_date' => 'nullable|date',
            'second_visit_date' => 'nullable|date',
            'third_visit_date' => 'nullable|date',
            'user_id' => 'nullable|integer',
        ];
    }
}
