<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ollama' => [
        'url' => env('OLLAMA_API_URL', 'http://127.0.0.1:11434'),
        'text_model' => env('OLLAMA_TEXT_MODEL', 'gemma4:e4b'),
        'vision_model' => env('OLLAMA_VISION_MODEL', 'gemma4:e4b'),
        'timeout' => (int) env('OLLAMA_TIMEOUT_SECONDS', 120),
        'connect_timeout' => (int) env('OLLAMA_CONNECT_TIMEOUT_SECONDS', 5),
        'notification_timeout' => (int) env('OLLAMA_NOTIFICATION_TIMEOUT_SECONDS', 8),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
