# Phase 2 Manual Verification Checklist

Date: 2026-04-22
Scope: Phase 2 auth, dashboard, and core API surface

Use this checklist to manually verify the current Phase 2 work before moving to later phases.

## Prerequisites

- WSL services are running: `nginx`, `php8.2-fpm`, `mysql`
- The app is reachable on the host IP from another device if LAN testing is needed
- Seed demo data if the system is empty: run `php backend/artisan db:seed --class=Database\\Seeders\\Phase2DemoDataSeeder`
- You know the seeded admin credentials:
  - Email: `2022jfevasco@live.mcl.edu.ph`
  - Password: `MMCLSAO2026`
- Demo credentials for role coverage (same password):
   - Staff: `staff.demo@sao-is.local`
   - Student: `student.demo@sao-is.local`
   - Faculty: `faculty.demo@sao-is.local`
- If non-admin credentials are not available, continue with admin-only checks and record role-coverage as deferred.

## 1) Login Flow

1. Open the app root in a browser and confirm it loads the SAO-IS React SPA, not the default Laravel welcome screen.
2. Open the app in a browser.
   - Local: `http://localhost`
   - LAN: `http://<windows-host-ip>`
3. Go to the login page if needed.
4. Sign in with the seeded admin account.
5. Expected result:
   - Login succeeds without an error banner
   - You are redirected to the dashboard
   - The dashboard shows the authenticated user name, email, and role

## 2) Role Dashboard Routing

1. After login, confirm the dashboard route matches the user role.
2. For the seeded admin user, the route should resolve to the admin dashboard path.
3. If non-admin accounts are unavailable, mark staff/org_officer/student/faculty routing checks as deferred.
4. Expected result:
   - The page title reflects the role-aware dashboard
   - The role mismatch warning does not appear
   - The dashboard content matches the signed-in role

## 3) Dashboard Summary Metrics

1. Stay on the dashboard page.
2. Wait for the live role summary cards to load.
3. Expected result:
   - Summary cards appear for the current role
   - Cards show live values instead of only static placeholders
   - If the API is temporarily unavailable, the page still renders fallback role cards

## 4) Authenticated API Smoke Test

Use your browser or a terminal session while logged in.

### Recommended browser check

1. Open these endpoints in the browser or use the Network tab:
   - `GET /api/v1/dashboard/summary`
   - `GET /api/v1/documents`
   - `GET /api/v1/approvals/queue`
   - `GET /api/v1/notifications`
   - `GET /api/v1/workflows`
2. Expected result:
   - Each endpoint returns `200 OK`
   - JSON payloads are present and do not show authentication errors

### Optional curl check

1. Confirm you are authenticated in the browser first, or use a cookie jar if testing via curl.
2. Request the endpoints above.
3. Expected result:
   - `200` responses for the authenticated requests
   - The dashboard summary returns a `role` field and a `modules` array

## 5) Documents Surface

1. Open the Documents module from a role card that links to `/documents`, or call `GET /api/v1/documents`.
2. Search for a document using `GET /api/v1/documents/search?q=<term>`.
3. Open one document using the document card link if test data exists.
4. Confirm the route becomes `/documents/<id>` and version history loads.
5. Expected result:
   - Documents list loads without errors
   - Search returns matching documents or an empty list
   - Document detail loads without a 403/404 for items you own or are allowed to view
   - Archive action is available for admin/staff when the document is open and not blocked by permissions

## 6) Approval Queue Surface

1. Open the Approvals module from a role card that links to `/approvals`, or call `GET /api/v1/approvals/queue`.
2. Open one item using the Review link and confirm the route becomes `/approvals/<id>`.
3. If the item is reviewable, use the approve/reject/request-info actions with a remarks field.
4. Expected result:
   - The request returns `200 OK`
   - A queue list is shown if there are documents assigned to the current role
   - Empty queue states render cleanly if there are no items
   - Approval history loads for the selected item
   - Review actions complete and return you to the queue

## 7) Notifications Surface

1. Open the Notifications module from a role card that links to `/notifications`, or call the endpoint directly.
2. Call `GET /api/v1/notifications`.
3. Expected result:
   - Notification list loads
   - Read/unread state is visible if data exists
   - Mark-read actions return success and refresh the list

## 8) Audit Logs Surface

1. From the admin dashboard, click the Audit Oversight card.
2. Confirm the page route is `/audit-logs` and the page renders an audit log list.
3. If data exists, confirm actor, document, action, and details are visible.
4. Expected result:
   - Audit log list loads successfully
   - Admin-only access is enforced
   - Seeded audit entries appear when demo data is present

## 9) Workflow Surface

1. From the admin dashboard, click the Workflow Templates card (Open module).
2. Confirm the page route is `/workflows` and the page renders a workflow list container.
3. Open one workflow from the list and confirm the route becomes `/workflows/<id>`.
4. Call `GET /api/v1/workflows`.
5. If data exists, open one workflow and its steps endpoint.
6. Expected result:
   - Workflow list loads successfully
   - Workflow row links open a detail page
   - Workflow details and step lists return `200 OK`

## 10) Logout Flow

1. Click Sign out.
2. Refresh the page or revisit a protected dashboard route.
3. Expected result:
   - You are returned to the login page
   - Protected routes redirect back to `/login`
   - `GET /api/v1/auth/me` returns `401` after logout

## 11) LAN Verification

1. From another device on the same LAN, open `http://<windows-host-ip>`.
2. Confirm the site loads from the remote device, not just on the Windows host.
3. Open `http://<windows-host-ip>/api/v1/health`.
4. Expected result:
   - Root page loads successfully
   - Health endpoint returns JSON with `status: ok`

## What Passes Mean

- You can sign in and out successfully
- The dashboard shows role-specific content
- Authenticated API endpoints return `200 OK`
- The app is reachable locally and, if needed, from another LAN device

## What to Record

- Browser screenshots of login and dashboard
- Any unexpected HTTP status codes
- Any role mismatch messages or empty-state problems
- Any LAN device reachability issues
