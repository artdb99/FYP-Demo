<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class RiskPredictionController extends Controller
{
    public function predict(Request $request)
    {
        // Step 1: Validate incoming request
        $validated = $request->validate([
            'AGE' => 'required|numeric',
            'GENDER' => 'required|integer',
            'DURATION_DM' => 'required|numeric',
            'Freq_SMBG' => 'required|numeric',
            'Freq_Hypo' => 'required|numeric',
            'Freq_of_Visits' => 'required|numeric',
            'eGFR' => 'required|numeric',
            'CKD_Stage' => 'required|integer',
        ]);

        // Step 2: Map to correct field names that FastAPI expects
        $dataForApi = [
            'AGE' => $validated['AGE'],
            'GENDER' => $validated['GENDER'],
            'DURATION DM' => $validated['DURATION_DM'],
            'Freq SMBG' => $validated['Freq_SMBG'],
            'Freq Hypo' => $validated['Freq_Hypo'],
            'Freq of Visits' => $validated['Freq_of_Visits'],
            'eGFR' => $validated['eGFR'],
            'CKD Stage' => $validated['CKD_Stage'],
        ];

        // Step 3: Send POST request to FastAPI server
        $response = Http::timeout(10)
            ->acceptJson()
            ->asJson()
            ->post('http://127.0.0.1:8001/predict', $dataForApi);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'prediction' => $response->json('predicted_hba1c'),
            ]);
        } else {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get prediction from FastAPI.',
                'details' => $response->body()
            ], 500);
        }
    }
}
