use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Throwable;

<?php

namespace App\Exceptions;


class Handler extends ExceptionHandler
{
    // ... other methods and properties

    /**
     * Convert a validation exception into a JSON response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Validation\ValidationException  $exception
     * @return \Illuminate\Http\JsonResponse
     */
    public function invalidJson($request, ValidationException $exception)
    {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $exception->errors(),
        ], $exception->status);
    }
}