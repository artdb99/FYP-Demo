<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use Carbon\Carbon;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Http\Resources\PatientResource;

class PatientController extends Controller
{
    public function store(StorePatientRequest $request)
    {
        $validated = $request->validated();

        // Store raw input
        $patient = Patient::create([
            'name' => $validated['name'],
            'age' => $validated['age'],
            'gender' => $validated['gender'],
            'height_cm' => $validated['height_cm'] ?? null,
            'weight_kg' => $validated['weight_kg'] ?? null,
            'physical_activity' => $validated['physical_activity'] ?? null,
            'medical_history' => $validated['medicalHistory'],
            'medications' => $validated['medications'],
            'remarks' => $validated['remarks'],
            'insulin_regimen_type' => $validated['insulinType'] ?? null,
            'fvg' => $validated['fvg'] ?? null,
            'fvg_1' => $validated['fvg_1'] ?? null,
            'fvg_2' => $validated['fvg_2'] ?? null,
            'fvg_3' => $validated['fvg_3'] ?? null,
            'hba1c_1st_visit' => $validated['hba1c1'] ?? null,
            'hba1c_2nd_visit' => $validated['hba1c2'] ?? null,
            'hba1c_3rd_visit' => $validated['hba1c3'] ?? null,
            'egfr' => $validated['egfr'] ?? null,
            'dds_1' => $validated['dds_1'] ?? null,
            'dds_3' => $validated['dds_3'] ?? null,
            'first_visit_date' => $validated['first_visit_date'] ?? null,
            'second_visit_date' => $validated['second_visit_date'] ?? null,
            'third_visit_date' => $validated['third_visit_date'] ?? null,
            'user_id' => $request->has('user_id') ? $request->input('user_id') : null, // 👈 Only assign if explicitly sent
        ]);

        // Calculate derived fields
        $fvg1 = $validated['fvg_1'] ?? null;
        $fvg2 = $validated['fvg_2'] ?? null;
        $hba1c1 = $validated['hba1c1'] ?? null;
        $hba1c2 = $validated['hba1c2'] ?? null;
        $hba1c3 = $validated['hba1c3'] ?? null;
        $dds1 = $validated['dds_1'] ?? null;
        $dds3 = $validated['dds_3'] ?? null;

        $firstVisit = isset($validated['first_visit_date']) ? Carbon::parse($validated['first_visit_date']) : null;
        $secondVisit = isset($validated['second_visit_date']) ? Carbon::parse($validated['second_visit_date']) : null;
        $thirdVisit = isset($validated['third_visit_date']) ? Carbon::parse($validated['third_visit_date']) : null;

        $patient->avg_fvg_1_2 = ($fvg1 !== null && $fvg2 !== null) ? ($fvg1 + $fvg2) / 2 : null;
        $patient->fvg_delta_1_2 = ($fvg2 !== null && $fvg1 !== null) ? ($fvg2 - $fvg1) : null;
        $patient->reduction_a = ($hba1c1 !== null && $hba1c2 !== null) ? ($hba1c1 - $hba1c2) : null;
        $patient->reduction_a_2_3 = ($hba1c2 !== null && $hba1c3 !== null) ? ($hba1c2 - $hba1c3) : null;
        $patient->reduction_a_per_day = ($hba1c1 !== null && $hba1c2 !== null && $firstVisit && $secondVisit)
            ? ($hba1c1 - $hba1c2) / max($firstVisit->diffInDays($secondVisit), 1)
            : null;
        // Gap fields should represent day differences between visits
        $patient->gap_from_initial_visit = ($firstVisit && $thirdVisit) ? $firstVisit->diffInDays($thirdVisit) : null;
        $patient->gap_from_first_clinical_visit = ($secondVisit && $thirdVisit) ? $secondVisit->diffInDays($thirdVisit) : null;
        $patient->dds_trend_1_3 = ($dds1 !== null && $dds3 !== null) ? ($dds3 - $dds1) : null;

        $patient->save();

        return response()->json(['message' => 'Patient saved', 'data' => $patient], 201);
    }

    public function update(UpdatePatientRequest $request, $id)
{
    $validated = $request->validated();

    $patient = Patient::findOrFail($id);

    // Update raw fields
    $patient->name = $validated['name'];
    $patient->age = $validated['age'];
    $patient->gender = $validated['gender'];
    $patient->height_cm = $validated['height_cm'] ?? null;
    $patient->weight_kg = $validated['weight_kg'] ?? null;
    $patient->physical_activity = $validated['physical_activity'] ?? null;
    $patient->medical_history = $validated['medicalHistory'];
    $patient->medications = $validated['medications'];
    $patient->remarks = $validated['remarks'];
    $patient->insulin_regimen_type = $validated['insulinType'] ?? null;
    $patient->fvg = $validated['fvg'] ?? null;
    $patient->fvg_1 = $validated['fvg_1'] ?? null;
    $patient->fvg_2 = $validated['fvg_2'] ?? null;
    $patient->fvg_3 = $validated['fvg_3'] ?? null;
    $patient->hba1c_1st_visit = $validated['hba1c1'] ?? null;
    $patient->hba1c_2nd_visit = $validated['hba1c2'] ?? null;
    $patient->hba1c_3rd_visit = $validated['hba1c3'] ?? null;
    $patient->egfr = $validated['egfr'] ?? null;
    $patient->dds_1 = $validated['dds_1'] ?? null;
    $patient->dds_3 = $validated['dds_3'] ?? null;
    $patient->first_visit_date = $validated['first_visit_date'] ?? null;
    $patient->second_visit_date = $validated['second_visit_date'] ?? null;
    $patient->third_visit_date = $validated['third_visit_date'] ?? null;

    // Derived calculations
    $fvg1 = $validated['fvg_1'] ?? null;
    $fvg2 = $validated['fvg_2'] ?? null;
    $hba1c1 = $validated['hba1c1'] ?? null;
    $hba1c2 = $validated['hba1c2'] ?? null;
    $hba1c3 = $validated['hba1c3'] ?? null;
    $dds1 = $validated['dds_1'] ?? null;
    $dds3 = $validated['dds_3'] ?? null;

    $firstVisit = isset($validated['first_visit_date']) ? Carbon::parse($validated['first_visit_date']) : null;
    $secondVisit = isset($validated['second_visit_date']) ? Carbon::parse($validated['second_visit_date']) : null;
    $thirdVisit = isset($validated['third_visit_date']) ? Carbon::parse($validated['third_visit_date']) : null;

    $patient->avg_fvg_1_2 = ($fvg1 !== null && $fvg2 !== null) ? ($fvg1 + $fvg2) / 2 : null;
    $patient->fvg_delta_1_2 = ($fvg2 !== null && $fvg1 !== null) ? ($fvg2 - $fvg1) : null;
    $patient->reduction_a = ($hba1c1 !== null && $hba1c2 !== null) ? ($hba1c1 - $hba1c2) : null;
    $patient->reduction_a_2_3 = ($hba1c2 !== null && $hba1c3 !== null) ? ($hba1c2 - $hba1c3) : null;
    $patient->reduction_a_per_day = ($hba1c1 !== null && $hba1c2 !== null && $firstVisit && $secondVisit)
        ? ($hba1c1 - $hba1c2) / max($firstVisit->diffInDays($secondVisit), 1)
        : null;
    // Gap fields should represent day differences between visits
    $patient->gap_from_initial_visit = ($firstVisit && $thirdVisit) ? $firstVisit->diffInDays($thirdVisit) : null;
    $patient->gap_from_first_clinical_visit = ($secondVisit && $thirdVisit) ? $secondVisit->diffInDays($thirdVisit) : null;
    $patient->dds_trend_1_3 = ($dds1 !== null && $dds3 !== null) ? ($dds3 - $dds1) : null;

    $patient->save();

    return response()->json(['message' => 'Patient updated', 'data' => $patient], 200);
}


    public function index(Request $request)
    {
        $query = Patient::query();

        // Optional filters
        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }
        if ($request->filled('insulin')) {
            $query->where('insulin_regimen_type', $request->input('insulin'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        // Backwards compatible: if no perPage, return full list as before
        if (!$request->filled('perPage')) {
            return response()->json($query->get());
        }

        $perPage = max((int) $request->input('perPage', 10), 1);
        $patients = $query->paginate($perPage);

        return PatientResource::collection($patients);
    }

    public function show($id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return new PatientResource($patient);
    }

    public function getByUserId($user_id)
{
    $patient = Patient::where('user_id', $user_id)->first();

    if (!$patient) {
        return response()->json(['message' => 'No linked patient'], 404);
    }

    return response()->json($patient);
}

    public function destroy($id)
{
    $patient = Patient::findOrFail($id);

    // If patient is linked to a user, delete user too
    if ($patient->user_id) {
        $patient->user()->delete();
    }

    $patient->delete();

    return response()->json(['message' => 'Patient and linked user deleted']);
}


}
