export const CONTENT_STATUSES = [
  'draft',
  'in_review',
  'in_changes',
  'approved',
  'rejected',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_TYPES = ['ad', 'social', 'email', 'blog', 'landing'] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const APPROVAL_STATUSES = ['approved', 'rejected', 'pending'] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
