export const CM_AUTO_WEEKLY_GENERATION_KEY = 'autoWeeklyGenerationEnabled';

export function readCommunityManagerSettings(
  tenantSettings: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const raw = tenantSettings?.communityManager;
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as Record<string, unknown>;
}

/** Cron semanal del copiloto; desactivado por defecto hasta que el tenant lo active. */
export function isAutoWeeklyGenerationEnabled(
  tenantSettings: Record<string, unknown> | null | undefined,
): boolean {
  const stored = readCommunityManagerSettings(tenantSettings);
  return stored[CM_AUTO_WEEKLY_GENERATION_KEY] === true;
}
