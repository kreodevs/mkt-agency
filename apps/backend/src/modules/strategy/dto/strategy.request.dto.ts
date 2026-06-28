import { IsOptional, IsString } from 'class-validator';

export class TriggerAnalysisDto {
  @IsOptional()
  @IsString()
  brandBriefId?: string;
}

export class UpdateSuggestionDto {
  @IsString()
  status!: 'approved' | 'rejected';
}