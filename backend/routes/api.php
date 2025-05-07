<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RiskPredictionController;

Route::post('/predict', [RiskPredictionController::class, 'predict']);
