# SAO-IS Student User Guide

## Overview

As a **Student**, you can submit documents (clearances, forms, permits), track their approval status, upload revised versions when requested, and receive notifications about your submissions.

## Getting Started

1. Open `http://<server-address>` in your browser
2. Login with your student email and password
3. You'll be directed to the Student Dashboard

## Dashboard

Your dashboard shows:
- **My Submissions** — count of your submitted documents
- **Pending** — documents waiting for review
- **Approved** — successfully approved documents
- Quick action links

## Submitting a Document (`/submit`)

1. Click **Submit** in the sidebar
2. Select the **Document Type** (e.g., "Student Clearance Form")
3. Enter a **title** for your submission
4. Attach your file (PDF, DOCX, XLSX, JPG, or PNG)
5. Click **Submit document**
6. You'll be redirected to the document detail page

> **Tip:** Make sure your file is the correct format. The system accepts: PDF, Word documents, Excel spreadsheets, and images.

## Tracking Your Submissions (`/my-submissions`)

1. Click **My Submissions** in the sidebar
2. View all your submitted documents with:
   - Title and type
   - Current status (Pending, In Review, Approved, Rejected, Awaiting Info)
   - Which approval step it's currently on
3. Click **View →** to see full details

### Understanding Status Colors

| Status | Meaning |
|--------|---------|
| 🟡 **Pending** | Submitted, waiting for initial review |
| 🔵 **In Review** | Currently being reviewed by an approver |
| 🟢 **Approved** | All approval steps completed |
| 🔴 **Rejected** | Rejected by a reviewer |
| 🟠 **Awaiting Info** | Reviewer requested additional information |
| ⚪ **Archived** | Document has been archived |

## Responding to "Request Info"

If a reviewer requests additional information:

1. You'll receive a notification
2. Open the document detail page
3. The status will show **Awaiting Info**
4. Click **Upload new version** to attach your revised file
5. The document automatically returns to **In Review**

## Viewing Document Details (`/documents/:id`)

The detail page shows:
- **Document info:** title, type, submitter, current step, dates
- **Version History:** all uploaded versions with download links
- Upload button for new versions

## Notifications (`/notifications`)

- The bell icon in the topbar shows your unread notification count
- Click it to see all notifications
- Common notifications:
  - "Your document passed review and moved to the next step"
  - "Your document has been approved"
  - "Your document has been rejected. Reason: ..."
  - "Additional information requested for your document"
- Click **View document →** to jump directly to the document
- Notifications are automatically marked as read when you open the page

## Need Help?

Contact the Student Affairs Office if you:
- Can't login to your account
- Need to submit a document type that isn't listed
- Have questions about the approval process
