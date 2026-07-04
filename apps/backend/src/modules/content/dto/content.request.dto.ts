import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CONTENT_STATUSES, CONTENT_TYPES, CONTENT_VISUAL_FORMATS } from '../domain/content.constants';
import { CM_PLATFORMS } from '../../community-manager/domain/cm-platforms.constants';

export class CreateContentDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsString()
  @IsIn([...CONTENT_TYPES])
  type!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsArray()
  assets?: unknown[];

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CM_PLATFORMS])
  platform?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CONTENT_VISUAL_FORMATS])
  visualFormat?: string;
}

export class UpdateContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsArray()
  assets?: unknown[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CONTENT_VISUAL_FORMATS])
  visualFormat?: string;
}

export class ListContentsQueryDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CONTENT_TYPES])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn([...CONTENT_STATUSES])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class FeedbackDto {
  @IsOptional()
  @IsString()
  feedback?: string;
}
