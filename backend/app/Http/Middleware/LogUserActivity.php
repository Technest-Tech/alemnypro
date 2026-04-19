<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ActivityLog;

class LogUserActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // We only log if user is authenticated and it's not an OPTIONS request
        if ($request->user() && $request->method() !== 'OPTIONS') {
            
            // Do not log the log endpoint itself or it triggers endless logs in dashboard
            if (!str_contains($request->path(), '/activity')) {
                // Strip sensitive data from payload
                $payload = $request->except(['password', 'password_confirmation', 'token']);
                
                ActivityLog::create([
                    'user_id' => $request->user()->id,
                    'action' => $request->method(),
                    'endpoint' => $request->path(),
                    'payload' => $payload,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);
            }
        }

        return $response;
    }
}
