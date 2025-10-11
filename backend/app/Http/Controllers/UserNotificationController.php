<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class UserNotificationController extends Controller
{
    // GET /api/notifications?unread=1
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        $unread = $request->boolean('unread', false);

        $query = UserNotification::query();
        if ($userId) {
            $query->where('user_id', $userId);
        }
        if ($unread) {
            $query->whereNull('read_at');
        }
        $items = $query->orderBy('created_at', 'desc')->limit(100)->get();
        return response()->json($items);
    }

    // GET /api/notifications/unread-count?user_id=...
    public function unreadCount(Request $request)
    {
        $userId = $request->query('user_id');
        $count = UserNotification::where('user_id', $userId)->whereNull('read_at')->count();
        return response()->json(['unread' => $count]);
    }

    // PATCH /api/notifications/{id}/read
    public function markRead($id)
    {
        $n = UserNotification::findOrFail($id);
        if (!$n->read_at) {
            $n->read_at = Carbon::now();
            $n->save();
        }
        return response()->json($n);
    }

    // PATCH /api/notifications/mark-all-read?user_id=...
    public function markAllRead(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json(['message' => 'user_id required'], 400);
        }
        UserNotification::where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);
        return response()->json(['message' => 'All notifications marked as read']);
    }
}
