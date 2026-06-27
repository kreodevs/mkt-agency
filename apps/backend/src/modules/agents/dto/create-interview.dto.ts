import { IsIn, IsString } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsIn(['brand_interview'])
  agentType!: string;
}