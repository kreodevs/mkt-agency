import type { ProposalStatus } from '../domain/proposal.constants';

export class ProposalResponseDto {
  id!: string;
  tenantId!: string;
  campaignId!: string | null;
  title!: string;
  content!: Record<string, unknown>;
  status!: ProposalStatus;
  signatureHash!: string | null;
  signedBy!: string | null;
  signedAt!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class CreateProposalResponseDto {
  id!: string;
  status!: ProposalStatus;
}

export class PaginatedProposalsResponseDto {
  items!: ProposalResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
