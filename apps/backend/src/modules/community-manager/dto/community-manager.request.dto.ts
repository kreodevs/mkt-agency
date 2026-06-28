import { IsArray, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'facebook', 'tiktok'] as const;

export class GenerateSocialCopyDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn([...PLATFORMS], { each: true })
  platforms!: string[];

  @IsInt()
  @Min(1)
  count!: number;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];
}