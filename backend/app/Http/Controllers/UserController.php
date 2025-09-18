<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // List all users
    public function index()
    {
        // Eager load patient relation
        $users = User::with('patient')->get();

        $data = $users->map(function ($user) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'patient_id' => $user->patient->id ?? null, // 👈 add patient_id directly
        ];
    });
        return response()->json($data, 200);
    }

    // Update user info
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $id,
            'role' => 'sometimes|in:admin,doctor,patient',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'User updated successfully', 'data' => $user], 200);
    }

    // Delete user
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // If this user is a patient, delete the patient row too
        if ($user->role === 'patient' && $user->patient) {
            $user->patient->delete();
        }
        $user->delete();

        return response()->json(['message' => 'User deleted successfully'], 200);
    }
}
