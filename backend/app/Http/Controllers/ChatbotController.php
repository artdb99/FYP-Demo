<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    public function message(Request $request)
    {
        try {
            $query = $request->input('message');
            
            \Log::info("Received chatbot input: " . $request->input('message'));


            if (!$query) {
                return response()->json(['response' => '❌ No question received.'], 400);
            }

            $fastApiUrl = env('FASTAPI_URL', 'http://127.0.0.1:5000');
            $response = Http::post("$fastApiUrl/rag", [
                'query' => $query
            ]);

            if ($response->successful()) {
                return response()->json([
                    'response' => $response->json()['response'] ?? '🤖 AI returned an empty response.'
                ]);
            }

            return response()->json([
                'response' => '❌ AI backend error: ' . $response->body()
            ], 500);
        } catch (\Throwable $e) {
            return response()->json([
                'response' => '❌ Server error: ' . $e->getMessage()
            ], 500);
        }
    }
}
