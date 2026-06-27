import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LLM_TASK_TYPES } from '../../../shared/ai/llm-task-types';

export class UpdateLlmTaskConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxTokens?: number | null;

  @IsOptional()
  @IsString()
  systemPromptTemplate?: string | null;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class LlmTaskTypeParamDto {
  @IsIn([...LLM_TASK_TYPES])
  taskType!: (typeof LLM_TASK_TYPES)[number];
}
