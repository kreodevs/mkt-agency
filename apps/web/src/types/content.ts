export type ContentStatus = 'draft' | 'in_review' | 'in_changes' | 'approved' | 'rejected';

export type ContentType = 'ad' | 'social' | 'email' | 'blog' | 'landing';

export type ContentVisualFormat = 'image' | 'video' | 'carousel';

export interface ContentVersion {
  id: string;
  versionNumber: number;
  authorId: string;
  title: string;
  body: string;
  assets: unknown[];
  reason: string | null;
  changeSummary: string | null;
  signatureHash: string | null;
  signedAt: string | null;
  createdAt: string;
}

export interface Content {
  id: string;
  tenantId: string;
  campaignId: string | null;
  productId: string | null;
  title: string;
  type: ContentType;
  status: ContentStatus;
  currentVersionId: string | null;
  currentVersion?: ContentVersion;
  scheduledDate: string | null;
  platform: string | null;
  visualFormat: ContentVisualFormat;
  visualPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedContentsResponse {
  items: Content[];
  total: number;
  page: number;
  limit: number;
}

export interface ListContentsParams {
  campaignId?: string;
  productId?: string;
  type?: ContentType;
  status?: ContentStatus;
  page?: number;
  limit?: number;
}

export interface CreateContentPayload {
  title: string;
  type: ContentType;
  body: string;
  campaignId?: string;
  scheduledDate?: string;
  assets?: unknown[];
}

export interface UpdateContentPayload {
  title?: string;
  body?: string;
  scheduledDate?: string | null;
  visualFormat?: ContentVisualFormat;
  visualPrompt?: string | null;
  platform?: string | null;
  assets?: unknown[];
  reason?: string;
  changeSummary?: string;
}

export interface ApproveContentResponse {
  contentId: string;
  versionId: string;
  versionNumber: number;
  status: ContentStatus;
  signatureHash: string;
  signedAt: string;
  message: string;
}
