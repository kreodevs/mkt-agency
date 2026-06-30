import type { CampaignExecutionMode } from '@/types/campaign';

export const CAMPAIGN_EXECUTION_MODES: CampaignExecutionMode[] = ['organic', 'paid'];

export const DEFAULT_CAMPAIGN_EXECUTION_MODE: CampaignExecutionMode = 'organic';

export function getCampaignExecutionMode(
  strategy: Record<string, unknown> | undefined,
): CampaignExecutionMode {
  if (strategy?.executionMode === 'paid') {
    return 'paid';
  }
  return 'organic';
}

export function executionModeLabel(mode: CampaignExecutionMode): string {
  return mode === 'paid' ? 'Medios pagados' : 'Publicación orgánica';
}
