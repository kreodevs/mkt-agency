import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsIn(['brand_interview'])
  agentType!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}