export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

export type StrategyAssignmentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CampaignTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  objective: string | null;
  platforms: string[];
  budgetDistribution: Record<string, unknown>;
  agentConfig: Record<string, unknown>;
  isPredefined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  templateId: string | null;
  name: string;
  objective: string | null;
  status: CampaignStatus;
  totalBudget: number | null;
  platforms: string[];
  strategy: Record<string, unknown>;
  budgets?: Budget[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  platform: string;
  dailyBudget: number;
  totalBudget: number;
  proposedByAi: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Audience {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  criteria: Record<string, unknown>;
  isActive: boolean;
  isImmutable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCampaignsResponse {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedCampaignTemplatesResponse {
  items: CampaignTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerateStrategyAccepted {
  assignmentId: string;
  status: 'pending' | 'processing';
  message: string;
}

export interface StrategyAssignment {
  assignmentId: string;
  campaignId: string;
  status: StrategyAssignmentStatus;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ListCampaignsParams {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  platform?: string;
}

export interface CreateCampaignPayload {
  name: string;
  objective?: string;
  templateId?: string;
  platforms?: string[];
  totalBudget?: number;
}

export interface UpdateCampaignPayload {
  name?: string;
  objective?: string;
  status?: CampaignStatus;
  platforms?: string[];
  totalBudget?: number;
}

export interface CampaignAgentReadinessItem {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  href: string;
  required: boolean;
}

export interface CampaignAgentReadiness {
  ready: boolean;
  completed: number;
  total: number;
  requiredCompleted: number;
  requiredTotal: number;
  items: CampaignAgentReadinessItem[];
  deliverables: string[];
}

export interface AutoGenerateCampaignResponse {
  campaignId: string;
  campaignName: string;
  strategyAssignmentId: string;
  strategyStatus: string;
  linkedContentCount: number;
  platforms: string[];
  message: string;
}
