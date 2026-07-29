import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class MarkPublishedWebhookDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  contentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalPostId?: string;
}

export class MarkContentPublishedDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  externalPostId?: string;
}

export class DispatchPublishWebhookResponseDto {
  contentId!: string;
  dispatched!: boolean;
  webhookUrl!: string | null;
  reason?: string;
}

export class MarkContentPublishedResponseDto {
  contentId!: string;
  publishedAt!: string;
  externalPostId!: string | null;
}
