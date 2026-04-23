<?php

use Illuminate\Support\Facades\Route;

$serveFrontend = function () {
    $indexPath = public_path('index.html');

    if (!file_exists($indexPath)) {
        abort(500, 'Frontend build not deployed. Run scripts/deploy-frontend.sh.');
    }

    return response()->file($indexPath);
};

Route::get('/', $serveFrontend);

Route::get('/{any}', $serveFrontend)
    ->where('any', '^(?!api).*$');
