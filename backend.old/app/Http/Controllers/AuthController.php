<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|confirmed|min:6',
        'role' => 'required|in:doctor,patient,admin',
        'phone' => 'nullable|string',
        'dob' => 'nullable|date',
        'gender' => 'required|string',
    ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => bcrypt($validated['password']),
        'role' => $validated['role'],
    ]);

if ($validated['role'] === 'patient') {
    Patient::create([
        'name' => $validated['name'],
        'user_id' => $user->id,
        'gender' => $validated['gender']
    ]);
}





    return response()->json([
        'message' => 'Registration successful',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
        ]
    ], 201);
}
public function login(Request $request)
{
    $credentials = $request->only('email', 'password');

    if (!Auth::attempt($credentials)) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();

    return response()->json([
        'message' => 'Login successful',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
        ]
    ]);
}

}
