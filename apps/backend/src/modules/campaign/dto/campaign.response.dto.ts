import { CampaignStatus } from '../domain/campaign.constants';
import type { CampaignScope } from '../../product/domain/product.constants';
import { StrategyAssignmentStatus } from '../infrastructure/typeorm/campaign-strategy-assignment.entity';

export class CampaignTemplateResponseDto {
  id!: string;
  tenantId!: string | null;
  name!: string;
  description!: string | null;
  objective!: string | null;
  platforms!: string[];
  budgetDistribution!: Record<string, unknown>;
  agentConfig!: Record<string, unknown>;
  isPredefined!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedCampaignTemplatesResponseDto {
  items!: CampaignTemplateResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class BudgetResponseDto {
  id!: string;
  platform!: string;
  dailyBudget!: number;
  totalBudget!: number;
  proposedByAi!: boolean;
  approved!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class CampaignResponseDto {
  id!: string;
  tenantId!: string;
  productId!: string | null;
  scope!: CampaignScope;
  templateId!: string | null;
  name!: string;
  objective!: string | null;
  status!: CampaignStatus;
  totalBudget!: number | null;
  platforms!: string[];
  strategy!: Record<string, unknown>;
  budgets?: BudgetResponseDto[];
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedCampaignsResponseDto {
  items!: CampaignResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class GenerateStrategyAcceptedDto {
  assignmentId!: string;
  status!: 'pending' | 'processing';
  message!: string;
}

export class StrategyAssignmentResponseDto {
  assignmentId!: string;
  campaignId!: string;
  status!: StrategyAssignmentStatus;
  result?: Record<string, unknown>;
  error?: string;
}

export class AudienceResponseDto {
  id!: string;
  tenantId!: string;
  name!: string;
  description!: string | null;
  criteria!: Record<string, unknown>;
  isActive!: boolean;
  isImmutable!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class PaginatedAudiencesResponseDto {
  items!: AudienceResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
