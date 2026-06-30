import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { CM_PLATFORMS } from '../domain/cm-platforms.constants';

export class GenerateSocialCopyDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsIn([...CM_PLATFORMS], { each: true })
  platforms!: string[];

  @IsInt()
  @Min(1)
  count!: number;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];
}

export class UpdateCommunityManagerPreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsIn([...CM_PLATFORMS], { each: true })
  platforms!: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  count?: number;
}