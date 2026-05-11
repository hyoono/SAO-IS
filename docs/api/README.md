# SAO-IS API Documentation

## Overview

All API endpoints are prefixed with `/api/v1` and require Laravel Sanctum cookie-based authentication (except login and health check).

**Base URL:** `http://localhost:8000/api/v1` (dev) or `http://<server-ip>/api/v1` (prod)

**Authentication:** SPA cookie-based via Laravel Sanctum. First fetch a CSRF token from `/sanctum/csrf-cookie`, then login via `/api/v1/auth/login`.

## API Reference

> Full specification: [openapi.yaml](./openapi.yaml)

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/sanctum/csrf-cookie` | No | Get CSRF token cookie |
| `POST` | `/auth/login` | No | Login with email + password |
| `POST` | `/auth/logout` | Yes | End session |
| `GET` | `/auth/me` | Yes | Get current user profile |
| `GET` | `/auth/ms365/redirect` | No | MS365 SSO redirect (501 — not configured) |
| `GET` | `/auth/ms365/callback` | No | MS365 SSO callback (501 — not configured) |

### Dashboard

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/dashboard/summary` | Yes | All | Role-aware summary metrics |

### Users

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/users` | Yes | admin | List all users (paginated) |
| `POST` | `/users` | Yes | admin | Create user |
| `GET` | `/users/{id}` | Yes | All | Get user details |
| `PATCH` | `/users/{id}` | Yes | All | Update user (admin or self) |

### Document Types

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/document-types` | Yes | All | List document types |
| `POST` | `/document-types` | Yes | admin, staff | Create document type |
| `PATCH` | `/document-types/{id}` | Yes | admin, staff | Update document type |

### Documents

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/documents` | Yes | All | List documents (paginated, filterable) |
| `GET` | `/documents/search` | Yes | All | Search documents by keyword |
| `POST` | `/documents` | Yes | All | Submit new document (multipart) |
| `GET` | `/documents/{id}` | Yes | All | Get document details |
| `GET` | `/documents/{id}/versions` | Yes | All | List document versions |
| `POST` | `/documents/{id}/versions` | Yes | All | Upload new version (multipart) |
| `GET` | `/documents/{id}/versions/{vid}/download` | Yes | All | Download file |
| `PATCH` | `/documents/{id}/archive` | Yes | admin, staff | Archive document |

### Approvals

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/approvals/queue` | Yes | admin, staff, faculty | Get approval queue |
| `POST` | `/documents/{id}/approve` | Yes | admin, staff, faculty | Approve current step |
| `POST` | `/documents/{id}/reject` | Yes | admin, staff, faculty | Reject document |
| `POST` | `/documents/{id}/request-info` | Yes | admin, staff, faculty | Request additional info |
| `GET` | `/documents/{id}/history` | Yes | All | Get approval history |

### Notifications

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/notifications` | Yes | All | List notifications |
| `PATCH` | `/notifications/{id}/read` | Yes | All | Mark one as read |
| `PATCH` | `/notifications/read-all` | Yes | All | Mark all as read |

### Audit Logs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/audit-logs` | Yes | admin | List all audit logs |
| `GET` | `/documents/{id}/audit` | Yes | admin | Audit trail for document |

### Workflows

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/workflows` | Yes | admin, staff | List workflow templates |
| `POST` | `/workflows` | Yes | admin, staff | Create workflow template |
| `GET` | `/workflows/{id}` | Yes | admin, staff | Get workflow with steps |
| `PUT` | `/workflows/{id}` | Yes | admin, staff | Update workflow + steps |
| `GET` | `/workflows/{id}/steps` | Yes | admin, staff | List workflow steps |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Health check |

## Common Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `401` | Unauthenticated (session expired) |
| `403` | Forbidden (role not allowed) |
| `404` | Not found |
| `419` | CSRF token mismatch |
| `422` | Validation error |
| `500` | Server error |
