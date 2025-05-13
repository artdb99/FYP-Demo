<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RiskPredictionController;
use App\Http\Controllers\PatientController;

Route::post('/predict', [RiskPredictionController::class, 'predict']);
Route::post('/patients', [PatientController::class, 'store']);
Route::get('/patients', [PatientController::class, 'index']);
Route::get('/patients/{id}', [PatientController::class, 'show']);

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');
