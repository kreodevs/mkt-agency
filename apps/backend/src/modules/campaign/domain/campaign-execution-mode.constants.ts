export const CAMPAIGN_EXECUTION_MODES = ['organic', 'paid'] as const;

export type CampaignExecutionMode = (typeof CAMPAIGN_EXECUTION_MODES)[number];

export const DEFAULT_CAMPAIGN_EXECUTION_MODE: CampaignExecutionMode = 'organic';
