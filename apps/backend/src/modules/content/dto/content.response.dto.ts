import { ContentStatus } from '../domain/content.constants';

export class ContentVersionResponseDto {
  id!: string;
  versionNumber!: number;
  authorId!: string;
  title!: string;
  body!: string;
  assets!: unknown[];
  reason!: string | null;
  changeSummary!: string | null;
  signatureHash!: string | null;
  signedAt!: string | null;
  createdAt!: string;
}

export class ContentResponseDto {
  id!: string;
  tenantId!: string;
  campaignId!: string | null;
  productId!: string | null;
  title!: string;
  type!: string;
  status!: ContentStatus;
  currentVersionId!: string | null;
  scheduledDate!: string | null;
  currentVersion?: ContentVersionResponseDto;
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedContentsResponseDto {
  items!: ContentResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class ApproveContentResponseDto {
  contentId!: string;
  versionId!: string;
  versionNumber!: number;
  status!: ContentStatus;
  signatureHash!: string;
  signedAt!: string;
  message!: string;
}

export class RejectContentResponseDto {
  contentId!: string;
  versionId!: string;
  status!: ContentStatus;
  message!: string;
}
