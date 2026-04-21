# SAO-IS API Documentation

This directory contains the OpenAPI specification for the SAO-IS REST API.

## Contents

- `openapi.yaml` — OpenAPI 3.0 specification (to be added in Phase 6)

## Base URL

`http://<server-ip>/api/v1`

## Authentication

All API endpoints use Laravel Sanctum SPA cookie-based authentication.
Fetch `/sanctum/csrf-cookie` before making any POST/PUT/PATCH/DELETE request.
