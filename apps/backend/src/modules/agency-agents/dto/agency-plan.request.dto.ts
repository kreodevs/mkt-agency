import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const METRICS = ['revenue', 'margin', 'roi', 'leads', 'awareness'] as const;

export class UpdateOperatingProfileDto {
  @IsOptional()
  @IsIn(['soho', 'growth'])
  profile?: 'soho' | 'growth';

  @IsOptional()
  @IsIn(['organic', 'paid'])
  campaignExecutionMode?: 'organic' | 'paid';

  @IsOptional()
  adBudget?: UpdateAdBudgetDto;
}

export class UpdateAdBudgetDto {
  @IsOptional()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyCap?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['meta', 'google', 'tiktok'], { each: true })
  platforms?: ('meta' | 'google' | 'tiktok')[];
}

export class CreateAgencyPlanDto {
  @IsString()
  @MaxLength(500)
  objective!: string;

  @IsOptional()
  @IsIn(METRICS)
  metric?: (typeof METRICS)[number];

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  horizon?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}
