# Phase 3 Manual Verification Checklist

Date: 2026-04-23
Scope: Phase 3 document management basics

Use this checklist to verify the first Phase 3 document-management slice: submission, version upload, download, search, and detail views.

## Prerequisites

- Phase 2 is already working and you can log in.
- Demo data has been seeded if the system is empty: `php backend/artisan db:seed --class=Database\\Seeders\\Phase2DemoDataSeeder`
- You have at least one supported file ready to upload:
  - PDF, DOCX, XLSX, JPG, or PNG

## 1) Document Type Lookup

1. Open the submit page at `/submit`.
2. Confirm the document type dropdown loads data.
3. Expected result:
   - At least one document type is visible
   - The form is usable without errors

## 2) Document Submission

1. Fill in a title.
2. Select a document type.
3. Attach a supported file.
4. Submit the form.
5. Expected result:
   - Submission succeeds
   - You are redirected to `/documents/<id>`
   - The new document shows `in_review` status
   - Version 1 is visible in the version list

## 3) Document List and Search

1. Open `/documents`.
2. Confirm the newly submitted document appears in the list.
3. Search for the document title.
4. Expected result:
   - Document list loads successfully
   - Search returns the matching document

## 4) Document Detail and Versioning

1. Open the submitted document detail page.
2. Confirm the version list loads.
3. Upload a second supported file version.
4. Expected result:
   - Version number increments
   - The new version appears in the version list
   - Download link is available for each version

## 5) Secure Download

1. Download a document version from the detail page.
2. Expected result:
   - The file downloads successfully
   - The download is authorized
   - An audit log entry is recorded for the download

## 6) Submission Access Rules

1. Confirm authorized roles can open `/submit`.
2. Confirm unauthorized roles are redirected away if needed by the current role rules.
3. Expected result:
   - Submission access matches the intended role policy

## What Passes Mean

- You can submit a new document
- The new document can be viewed and searched
- Document versions can be uploaded and downloaded
- Audit logging records document download activity

## What to Record

- The submitted document title and ID
- Any validation errors for file type or size
- Version numbers after upload
- Any download failures or permission errors
