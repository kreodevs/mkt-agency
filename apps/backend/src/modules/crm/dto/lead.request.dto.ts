import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LEAD_STAGES } from '../domain/lead.constants';

export class ListLeadsQueryDto {
  @IsOptional()
  @IsIn([...LEAD_STAGES])
  stage?: (typeof LEAD_STAGES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minScore?: number;

  @IsOptional()
  @IsUUID()
  formId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;
}

export class ChangeLeadStageDto {
  @IsIn([...LEAD_STAGES])
  stage!: (typeof LEAD_STAGES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class AddInteractionDto {
  @IsString()
  @MaxLength(100)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
