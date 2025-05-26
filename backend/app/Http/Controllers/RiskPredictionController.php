<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RiskPredictionController extends Controller{
public function predict(Request $request)
{
    $validated = $request->validate([
        'HbA1c1' => 'required|numeric',
        'HbA1c2' => 'required|numeric',
        'FVG1' => 'required|numeric',
        'FVG2' => 'required|numeric',
        'Avg_FVG_1_2' => 'required|numeric',
        'ReductionA' => 'required|numeric',
        'ReductionA_per_day' => 'required|numeric',
        'FVG_Delta_1_2' => 'required|numeric',
    ]);

    $dataForFastAPI = [
        'features' => [
            (float) $validated['HbA1c1'],
            (float) $validated['HbA1c2'],
            (float) $validated['FVG1'],
            (float) $validated['FVG2'],
            (float) $validated['Avg_FVG_1_2'],
            (float) $validated['ReductionA'],
            (float) $validated['ReductionA_per_day'],
            (float) $validated['FVG_Delta_1_2'],
        ]
    ];

    \Log::info('Sending to FastAPI:', $dataForFastAPI); // Optional debug

    $fastApiUrl = env('FASTAPI_URL', 'http://127.0.0.1:5000');
    $response = Http::timeout(10)
    ->acceptJson()
    ->asJson()
    ->post("$fastApiUrl/predict", $dataForFastAPI);

    if ($response->successful()) {
        return response()->json([
            'success' => true,
            'prediction' => $response->json('prediction')
        ]);
    }

    return response()->json([
        'success' => false,
        'error' => 'Failed to get prediction from FastAPI.',
        'details' => $response->body()
    ], 500);
}
}
