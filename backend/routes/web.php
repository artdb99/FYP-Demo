<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    Log::info('Catch-all route hit, serving index.html');
    $path = public_path('index.html');
    if (!file_exists($path)) {
        Log::error("index.html not found at: {$path}");
        return response('index.html not found', 404);
    }
    return file_get_contents($path);
})->where('any', '.*');