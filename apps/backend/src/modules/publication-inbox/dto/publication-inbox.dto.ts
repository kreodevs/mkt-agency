import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
  body!: string;
  platform!: string | null;
  visualFormat!: string;
  assets!: unknown[];
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
  rejected!: PublicationInboxItemDto[];
  notifications!: AgencyNotificationDto[];
  stats!: {
    pendingCount: number;
    readyCount: number;
    upcomingCount: number;
    rejectedCount: number;
    unreadNotifications: number;
  };
}

export class BulkApproveResponseDto {
  approved!: number;
  failed!: Array<{ contentId: string; reason: string }>;
}

export class PrepareWeekDto {
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class CopilotStatusResponseDto {
  productId!: string;
  productName!: string;
  onboardingCompleted!: boolean;
  competitorsCount!: number;
  analysisStatus!: string;
  analysisUpdatedAt!: string | null;
  inbox!: {
    pendingCount: number;
    readyCount: number;
    upcomingCount: number;
    rejectedCount: number;
    unreadNotifications: number;
  };
  nextStep!: string;
  canPrepareWeek!: boolean;
  cmCharacterReady!: boolean;
  cmCharacterStatus!: string;
  cmCharactersReadyCount!: number;
  cmCharactersTotalCount!: number;
  prepareBlockedReason!: string | null;
}

export class PrepareWeekResponseDto {
  status!: 'completed' | 'empty' | 'blocked';
  message!: string;
  productId!: string;
  productName!: string;
  postsGenerated!: number;
  imagesAttached!: number;
  strategyId?: string | null;
  topicsUsed?: string[];
  warnings!: string[];
}

export class PrepareWeekJobStartedDto {
  jobId!: string;
  status!: 'processing';
}

export class PrepareWeekJobStatusDto {
  jobId!: string;
  status!: 'processing' | 'completed' | 'failed';
  result?: PrepareWeekResponseDto;
  error?: string;
}

export class RequestInboxChangesDto {
  @IsUUID()
  versionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  feedback!: string;
}

export class RequestInboxChangesResponseDto {
  contentId!: string;
  title!: string;
  regenerated!: true;
}

export class RegenerateInboxContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  feedback?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  visualFormat?: string;
}

export class DismissInboxContentResponseDto {
  contentId!: string;
  dismissed!: true;
}
