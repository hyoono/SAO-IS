<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Log API requests to the audit_logs table for authenticated users.
     * Captures the HTTP method, URI, and IP address.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log for authenticated users and successful mutations
        $user = $request->user();
        if ($user && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            try {
                AuditLog::create([
                    'user_id' => $user->id,
                    'document_id' => null,
                    'action' => strtolower($request->method()) . ':' . $request->path(),
                    'details' => [
                        'method' => $request->method(),
                        'uri' => $request->path(),
                        'ip' => $request->ip(),
                        'status_code' => $response->getStatusCode(),
                    ],
                ]);
            } catch (\Throwable $e) {
                // Silently fail — audit logging should never break the request
                report($e);
            }
        }

        return $response;
    }
}
