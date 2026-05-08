import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  clinic?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsArray()
  painPoints?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadStageDto {
  @IsString()
  @IsNotEmpty()
  stage: string;
}