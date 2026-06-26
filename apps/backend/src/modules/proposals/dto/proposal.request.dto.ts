import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { ProposalStatus } from '../domain/proposal.constants';

export class CreateProposalDto {
  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class ListProposalsQueryDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsString()
  status?: ProposalStatus;
}

export class RejectProposalDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
