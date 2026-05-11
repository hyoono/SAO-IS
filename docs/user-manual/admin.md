# SAO-IS Admin User Guide

## Overview

As an **Admin**, you have full access to the SAO-IS system. You can manage users, configure workflows, review documents, and monitor system activity.

## Getting Started

1. Open `http://<server-address>` in your browser
2. Login with your admin credentials
3. You'll be directed to the Admin Dashboard

## Dashboard

Your dashboard shows system-wide metrics:
- **Active Users** — total registered users
- **Pending Reviews** — documents waiting for approval
- **Documents Processed** — total approved/rejected
- **Notifications** — unread alerts

## Managing Users (`/admin/users`)

### View Users
- Click **Users** in the sidebar under Administration
- Use the role filter pills (All, Admin, Staff, Student, Faculty) to narrow the list

### Create a User
1. Click **+ New User**
2. Fill in: Name, Email, Password, Role
3. Click **Create User**
4. The new user can now login with those credentials

### Edit a User
1. Click **Edit** on any user row
2. Change their name, role, or set a new password
3. Click **Save Changes**

> **Note:** You cannot change a user's email after creation.

## Managing Document Types (`/admin/document-types`)

Document types define categories (e.g., "Student Clearance Form", "Event Proposal") and link them to workflow templates.

### Create a Document Type
1. Click **+ New Type**
2. Enter a name
3. Select the workflow template that documents of this type should follow
4. Optionally set an expiry period (in days)
5. Click **Create**

### Edit a Document Type
1. Click **Edit** on any type row
2. Modify the name, workflow, or expiry
3. Click **Save**

## Managing Workflows (`/workflows`)

Workflows define the multi-step approval process for documents.

### Create a Workflow
1. Click **Workflows** in sidebar → **+ New Workflow**
2. Enter a name and optional description
3. Add steps using **+ Add Step**:
   - Step Name (e.g., "Admin Review")
   - Assignee Role (which role handles this step)
4. Use the ▲▼ buttons to reorder steps
5. Click **Create Workflow**

### Edit a Workflow
1. Open a workflow → click **Edit**
2. Modify steps, reorder, add, or remove
3. Click **Save Changes**

> **Important:** Editing a workflow only affects new documents. Documents already in the pipeline continue with their original workflow.

## Reviewing Documents (`/approvals`)

1. Click **Approvals** in sidebar
2. Documents assigned to your role's step appear here
3. Click **Review →** to open the approval detail
4. You'll see:
   - Document info (submitter, step, dates)
   - Attached file with download link
   - Approval history
5. Enter optional remarks, then click:
   - **Approve** — advances to next step (or finalizes)
   - **Reject** — rejects the document
   - **Request Info** — sends back for revision

## Audit Log (`/audit-logs`)

- Click **Audit Log** in sidebar
- View all system actions: logins, document uploads, approvals, user changes
- Each entry shows: Action, User, Document (if applicable), Timestamp

## Archive (`/admin/archive`)

- View documents that have been archived (manually or by expiry)
- Archived documents are read-only

## Notifications

- The bell icon in the topbar shows unread notification count
- Click it to view all notifications
- Notifications are automatically marked as read when you open the page
