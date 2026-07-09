import type { CampaignExecutionMode } from '../../campaign/domain/campaign-execution-mode.constants';

export type TenantProfile = 'soho' | 'growth';

export type OperatingSubProfile = 'soho' | 'growth_organic' | 'growth_paid';

export type AgentActivationLevel = 'off' | 'lite' | 'standard' | 'full' | 'optional';

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

export interface UpdateOperatingProfileInput {
  profile?: TenantProfile;
  campaignExecutionMode?: CampaignExecutionMode;
  adBudget?: Partial<AdBudgetConfig>;
}

export interface AgentActivationMatrix {
  strategist: AgentActivationLevel;
  analytics: AgentActivationLevel;
  media_buyer: AgentActivationLevel;
  creative: AgentActivationLevel;
  community: AgentActivationLevel;
}

export const DEFAULT_OPERATING_PROFILE: TenantOperatingProfile = {
  profile: 'soho',
  campaignExecutionMode: 'organic',
  adBudget: {
    enabled: false,
    monthlyCap: null,
    currency: 'MXN',
    platforms: [],
  },
};

export const SETTINGS_KEY_OPERATING_PROFILE = 'operatingProfile';
