<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| During development, the frontend runs on Vite (localhost:5173).
| In production, deploy the frontend build to backend/public/ using
| scripts/deploy-frontend.sh, then uncomment the SPA catch-all below.
|
*/

// SPA catch-all — uncomment ONLY after deploying frontend build:
// Route::get('/{any}', function () {
//     return response()->file(public_path('index.html'));
// })->where('any', '^(?!api).*$');
