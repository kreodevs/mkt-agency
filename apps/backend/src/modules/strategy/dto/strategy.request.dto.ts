import { IsOptional, IsString, IsUUID } from 'class-validator';

export class TriggerAnalysisDto {
  @IsOptional()
  @IsString()
  brandBriefId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class UpdateSuggestionDto {
  @IsString()
  status!: 'approved' | 'rejected';
}