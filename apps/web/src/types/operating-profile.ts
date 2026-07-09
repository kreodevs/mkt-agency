export type TenantProfile = 'soho' | 'growth';

export type OperatingSubProfile = 'soho' | 'growth_organic' | 'growth_paid';

export type CampaignExecutionMode = 'organic' | 'paid';

export type AgentActivationLevel = 'off' | 'lite' | 'standard' | 'full' | 'optional';

export type AgentRole =
  | 'strategist'
  | 'analytics'
  | 'media_buyer'
  | 'creative'
  | 'community';

export interface AdBudgetConfig {
  enabled: boolean;
  monthlyCap: number | null;
  currency: string;
  platforms: ('meta' | 'google' | 'tiktok')[];
}

export interface TenantOperatingProfile {
  profile: TenantProfile;
  campaignExecutionMode: CampaignExecutionMode;
  adBudget: AdBudgetConfig;
}

export interface AgentCapability {
  active: boolean;
  level: AgentActivationLevel;
}

export interface OperatingProfileResponse {
  profile: TenantOperatingProfile;
  subProfile: OperatingSubProfile;
  capabilities: Record<AgentRole, AgentCapability>;
}

export interface UpdateOperatingProfilePayload {
  profile?: TenantProfile;
  campaignExecutionMode?: CampaignExecutionMode;
  adBudget?: Partial<AdBudgetConfig>;
}

export interface AgentEventItem {
  id: string;
  sourceAgent: string;
  targetAgent: string | null;
  eventType: string;
  status: string;
  productId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AgencyPlan {
  id: string;
  productId: string | null;
  status: string;
  strategistOutput: Record<string, unknown>;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgencyPlanPayload {
  objective: string;
  metric?: 'revenue' | 'margin' | 'roi' | 'leads' | 'awareness';
  target?: number;
  horizon?: string;
  productId?: string;
  channels?: string[];
}

export interface LeadPerformanceSummary {
  periodDays: number;
  totalLeads: number;
  bySource: Array<{ source: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
}

export const SUBPROFILE_LABELS: Record<OperatingSubProfile, string> = {
  soho: 'Copiloto SOHO',
  growth_organic: 'Growth orgánico',
  growth_paid: 'Growth con pauta',
};

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  strategist: 'Estrategia de negocio',
  analytics: 'Datos y atribución',
  media_buyer: 'Compra de medios',
  creative: 'Creativo y copy',
  community: 'Comunidad y leads',
};
