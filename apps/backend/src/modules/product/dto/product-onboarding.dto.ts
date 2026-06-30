import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProductOnboardingStatusDto {
  productId!: string;
  productName!: string;
  completionPercentage!: number;
  ready!: boolean;
  completed!: boolean;
  missingFields!: string[];
  fields!: Array<{
    key: string;
    label: string;
    complete: boolean;
    required: boolean;
  }>;
}

export class SuggestProductKeywordsResponseDto {
  keywords!: string[];
  sourceUrl?: string | null;
  generatedFromPage!: boolean;
}

export class SuggestProductKeywordsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;
}

export class ProductOnboardingAgentsDto {
  brandInterviewId?: string | null;
  competitorAnalysisId?: string | null;
  communityManagerBatchId?: string | null;
  competitorsDiscovered?: number;
  skippedAgents?: string[];
  warnings?: string[];
}

export class CompleteProductOnboardingResponseDto {
  product!: {
    id: string;
    name: string;
    onboardingCompleted: boolean;
    completionPercentage: number;
  };
  agents!: ProductOnboardingAgentsDto;
}
