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

/** Formato visual: image | carousel | talking-head (retrato CM + lip-sync). */
export const CONTENT_VISUAL_FORMATS = ['image', 'carousel', 'talking-head'] as const;

export type ContentVisualFormat = (typeof CONTENT_VISUAL_FORMATS)[number];

/** Valor legacy en DB; se normaliza a `image` en lectura/escritura. */
export const LEGACY_VIDEO_VISUAL_FORMAT = 'video' as const;

export const DEFAULT_CONTENT_VISUAL_FORMAT: ContentVisualFormat = 'image';

export const CAROUSEL_FRAME_COUNT = 3;

export const APPROVAL_STATUSES = ['approved', 'rejected', 'pending'] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
