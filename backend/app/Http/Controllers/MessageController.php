<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Patient;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MessageController extends Controller
{
    // GET /api/messages/conversations?user_id=..&role=doctor|patient
    public function conversations(Request $request)
    {
        $userId = $request->query('user_id');
        $role = $request->query('role');
        if (!$userId || !$role) {
            return response()->json([], 400);
        }

        // Doctor: list all assigned patients
        if ($role === 'doctor') {
            $patients = Patient::where('assigned_doctor_id', $userId)->get(['id', 'name']);
            $result = [];
            foreach ($patients as $p) {
                $last = Message::where('patient_id', $p->id)
                    ->where('doctor_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->first();
                $unread = Message::where('patient_id', $p->id)
                    ->where('doctor_id', $userId)
                    ->whereNull('read_at')
                    ->where('sender_type', 'patient')
                    ->count();
                $result[] = [
                    'patient_id' => $p->id,
                    'patient_name' => $p->name,
                    'last_message_snippet' => $last ? mb_substr($last->body, 0, 120) : null,
                    'last_message_at' => $last ? $last->created_at : null,
                    'unread_count' => $unread,
                ];
            }
            // Sort by last_message_at desc
            usort($result, function ($a, $b) {
                return strtotime($b['last_message_at'] ?? '1970-01-01') <=> strtotime($a['last_message_at'] ?? '1970-01-01');
            });
            return response()->json($result);
        }

        // Patient: return their single conversation (if any)
        if ($role === 'patient') {
            $patient = Patient::where('user_id', $userId)->first();
            if (!$patient || !$patient->assigned_doctor_id) {
                return response()->json([]);
            }
            $last = Message::where('patient_id', $patient->id)
                ->where('doctor_id', $patient->assigned_doctor_id)
                ->orderBy('created_at', 'desc')
                ->first();
            $unread = Message::where('patient_id', $patient->id)
                ->where('doctor_id', $patient->assigned_doctor_id)
                ->whereNull('read_at')
                ->where('sender_type', 'doctor')
                ->count();
            return response()->json([
                [
                    'patient_id' => $patient->id,
                    'patient_name' => $patient->name,
                    'last_message_snippet' => $last ? mb_substr($last->body, 0, 120) : null,
                    'last_message_at' => $last ? $last->created_at : null,
                    'unread_count' => $unread,
                ],
            ]);
        }

        return response()->json([]);
    }
    // GET /api/messages/thread/{patientId}
    public function thread($patientId)
    {
        $patient = Patient::findOrFail($patientId);
        $doctorId = $patient->assigned_doctor_id;

        $messages = Message::where('patient_id', $patient->id)
            ->where('doctor_id', $doctorId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    // POST /api/messages
    // Body: { patient_id, sender_type: 'doctor'|'patient', body }
    public function send(Request $request)
    {
        $data = $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'sender_type' => 'required|in:doctor,patient',
            'body' => 'required|string',
        ]);

        $patient = Patient::findOrFail($data['patient_id']);
        $doctorId = $patient->assigned_doctor_id;
        if (!$doctorId) {
            return response()->json(['message' => 'Patient has no assigned doctor'], 422);
        }

        $message = Message::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctorId,
            'sender_type' => $data['sender_type'],
            'body' => $data['body'],
        ]);

        // Create a notification for the recipient
        // If sender is doctor -> notify patient.user_id, else notify doctor_id
        if ($data['sender_type'] === 'doctor') {
            if ($patient->user_id) {
                UserNotification::create([
                    'user_id' => $patient->user_id,
                    'type' => 'message.new',
                    'data' => [
                        'patient_id' => $patient->id,
                        'doctor_id' => $doctorId,
                        'message_id' => $message->id,
                        'snippet' => mb_substr($message->body, 0, 120),
                    ],
                ]);
            }
        } else {
            UserNotification::create([
                'user_id' => $doctorId,
                'type' => 'message.new',
                'data' => [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctorId,
                    'message_id' => $message->id,
                    'snippet' => mb_substr($message->body, 0, 120),
                ],
            ]);
        }

        return response()->json($message, 201);
    }

    // PATCH /api/messages/{id}/read
    public function markRead($id)
    {
        $message = Message::findOrFail($id);
        if (!$message->read_at) {
            $message->read_at = Carbon::now();
            $message->save();
        }
        return response()->json($message);
    }

    // DELETE /api/messages/thread/{patientId}
    public function clearThread($patientId, Request $request)
    {
        $patient = Patient::findOrFail($patientId);
        $doctorId = $patient->assigned_doctor_id;
        if (!$doctorId) {
            return response()->json(['message' => 'No assigned doctor'], 422);
        }

        // Optionally: authorize based on authenticated user here
        Message::where('patient_id', $patient->id)
            ->where('doctor_id', $doctorId)
            ->delete();

        return response()->json(['status' => 'ok']);
    }
}
