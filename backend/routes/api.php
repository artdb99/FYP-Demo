<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RiskPredictionController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatbotController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\UserNotificationController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/patients', [PatientController::class, 'store']);
Route::post('/chatbot/message', [ChatbotController::class, 'message']);
Route::put('/patients/{id}', [PatientController::class, 'update']);
Route::get('/patients/by-user/{userId}', [PatientController::class, 'getByUserId']);
Route::get('/patients', [PatientController::class, 'index']);
Route::get('/patients/{id}', [PatientController::class, 'show']);
Route::get('/patients/{id}/doctor', [PatientController::class, 'doctor']);
Route::post('/patients/{id}/risk', [PatientController::class, 'saveRisk']);
Route::delete('/account', [UserController::class, 'deleteSelf']);

// Messaging
Route::get('/messages/conversations', [MessageController::class, 'conversations']);
Route::get('/messages/thread/{patientId}', [MessageController::class, 'thread']);
Route::post('/messages', [MessageController::class, 'send']);
Route::patch('/messages/{id}/read', [MessageController::class, 'markRead']);
Route::delete('/messages/thread/{patientId}', [MessageController::class, 'clearThread']);

// Notifications
Route::get('/notifications', [UserNotificationController::class, 'index']);
Route::get('/notifications/unread-count', [UserNotificationController::class, 'unreadCount']);
Route::patch('/notifications/{id}/read', [UserNotificationController::class, 'markRead']);
Route::patch('/notifications/mark-all-read', [UserNotificationController::class, 'markAllRead']);

Route::options('{any}', function () {
    return response()->json([], 200);
})->where('any', '.*');

Route::prefix('admin')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/patients', [PatientController::class, 'index']);
    Route::delete('/patients/{id}', [PatientController::class, 'destroy']);
    Route::patch('/patients/{id}/assign-doctor', [PatientController::class, 'assignDoctor']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
});

