/**
 * Role constants matching the backend enum values.
 */
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  ORG_OFFICER: 'org_officer',
  STUDENT: 'student',
  FACULTY: 'faculty',
  DIRECTOR: 'director',
  CENTER_HEAD: 'center_head',
}

/**
 * Document status constants.
 */
export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  AWAITING_INFO: 'awaiting_info',
  ARCHIVED: 'archived',
}

/**
 * Allowed MIME types for document upload.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]

/**
 * Human-readable labels for roles.
 */
export const ROLE_LABELS = {
  admin: 'Admin',
  staff: 'Staff',
  org_officer: 'Org Officer',
  student: 'Student',
  faculty: 'Faculty',
  director: 'Director',
  center_head: 'Center Head',
}

/**
 * Human-readable labels for document statuses.
 */
export const STATUS_LABELS = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  awaiting_info: 'Awaiting Info',
  archived: 'Archived',
}
