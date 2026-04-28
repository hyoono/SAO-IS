# Phase 4 — Manual Verification Checklist

> Admin Management & Workflow Builder

## Prerequisites

- Phase 3 passes all tests (login, submit, documents list, versions)
- Logged in as admin: `2022jfevasco@live.mcl.edu.ph` / `MMCLSAO2026`

## 1) User Management (`/admin/users`)

1. Navigate to `/admin/users` via the sidebar.
2. Confirm the user table loads with all seeded users.
3. Click the role filter pills (Admin, Staff, Student, Faculty).
4. Click **+ New User**, fill in the form, and create a user.
5. Click **Edit** on a user row, change their role, and save.
6. Expected results:
   - Table shows Name, Email, Role (badge), Created date
   - Role filter updates the displayed users
   - New user appears in the table after creation
   - Edited role persists after refresh
   - Non-admin users cannot access this page (403)

## 2) Document Types (`/admin/document-types`)

1. Navigate to `/admin/document-types` via the sidebar.
2. Confirm the existing "Student Clearance Form" type appears.
3. Click **+ New Type** and create a document type:
   - Name: "Event Proposal"
   - Workflow: select the existing "General Clearance Workflow"
   - Expiry: 90 days
4. Click **Edit** on an existing type, change the name, and save.
5. Expected results:
   - Table shows Name, Workflow name, Expiry
   - New type appears after creation
   - Edited name persists after refresh

## 3) Workflow Builder (`/workflows/new`)

1. Navigate to `/workflows` and click **+ New Workflow**.
2. Fill in:
   - Name: "Quick Review"
   - Description: "Two-step fast-track approval"
3. Add two steps:
   - Step 1: Name = "Director Screening", Role = Admin
   - Step 2: Name = "Staff Final Check", Role = Staff
4. Use the ▲▼ arrows to reorder Step 2 above Step 1.
5. Click **Create Workflow**.
6. Expected results:
   - Redirected to `/workflows/<id>` showing the step timeline
   - Steps are in the reordered sequence
   - New workflow appears in the `/workflows` list

## 4) Workflow Detail (`/workflows/:id`)

1. Open the workflow created in step 3.
2. Confirm the step timeline shows numbered steps with assignee roles.
3. Expected results:
   - Visual numbered timeline (1 → 2 → ...)
   - Each step shows name and assignee role label

## 5) End-to-End: New Type → Submit → Approve

1. Create a new workflow template via the builder
2. Create a new document type linked to that workflow
3. Login as student, submit a document using the new type
4. Login as the role assigned to step 1, approve it
5. Expected results:
   - Document moves through the custom workflow steps
   - Notifications are generated for each step
