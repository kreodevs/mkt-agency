import { IsOptional, IsString } from 'class-validator';

export class ApproveProposalDto {
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class RejectProposalDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
