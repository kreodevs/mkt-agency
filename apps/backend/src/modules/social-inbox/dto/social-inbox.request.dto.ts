import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  SOCIAL_CHANNELS,
  SOCIAL_PLATFORMS,
} from '../domain/interaction-intent.constants';

export class IngestSocialInteractionDto {
  @IsString()
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsIn([...SOCIAL_PLATFORMS])
  platform?: string;

  @IsOptional()
  @IsIn([...SOCIAL_CHANNELS])
  channel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorHandle?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListSocialInteractionsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  intent?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
