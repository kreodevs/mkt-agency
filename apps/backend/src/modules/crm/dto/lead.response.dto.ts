import type { LeadStage } from '../domain/lead.constants';

export class LeadInteractionResponseDto {
  id!: string;
  leadId!: string;
  type!: string;
  description!: string | null;
  metadata!: Record<string, unknown>;
  createdAt!: string;
}

export class LeadResponseDto {
  id!: string;
  tenantId!: string;
  email!: string;
  name!: string | null;
  phone!: string | null;
  company!: string | null;
  score!: number;
  stage!: LeadStage;
  metadata!: Record<string, unknown>;
  formSubmissionId!: string | null;
  createdAt!: string;
  updatedAt!: string;
  recentInteractions?: LeadInteractionResponseDto[];
}

export class PaginatedLeadsResponseDto {
  items!: LeadResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class LeadInteractionsListResponseDto {
  items!: LeadInteractionResponseDto[];
  total!: number;
}
