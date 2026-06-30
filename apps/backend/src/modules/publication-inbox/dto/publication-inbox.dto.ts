import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsUUID } from 'class-validator';

export class PublicationInboxQueryDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class BulkApproveDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  contentIds!: string[];
}

export class PublicationInboxItemDto {
  contentId!: string;
  title!: string;
  type!: string;
  status!: string;
  campaignId!: string | null;
  campaignName!: string | null;
  productId!: string | null;
  productName!: string | null;
  versionId!: string | null;
  versionNumber!: number | null;
  signatureHash!: string | null;
  scheduledDate!: string;
  preview!: string;
}

export class AgencyNotificationDto {
  id!: string;
  type!: string;
  title!: string;
  body!: string;
  productId!: string | null;
  metadata!: Record<string, unknown>;
  readAt!: string | null;
  createdAt!: string;
}

export class PublicationInboxResponseDto {
  pendingApproval!: PublicationInboxItemDto[];
  readyToPublish!: PublicationInboxItemDto[];
  upcoming!: PublicationInboxItemDto[];
  notifications!: AgencyNotificationDto[];
  stats!: {
    pendingCount: number;
    readyCount: number;
    upcomingCount: number;
    unreadNotifications: number;
  };
}

export class BulkApproveResponseDto {
  approved!: number;
  failed!: Array<{ contentId: string; reason: string }>;
}
