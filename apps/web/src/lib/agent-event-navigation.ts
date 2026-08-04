export interface AgentEventNavigation {
  href: string;
  label: string;
}

/** Maps inter-agent event types to a user-facing destination (SOHO vs Growth). */
export function getAgentEventNavigation(
  eventType: string,
  isSoho: boolean,
): AgentEventNavigation | null {
  switch (eventType) {
    case 'SohoWeekPrepared':
    case 'ContentBrief':
    case 'CreativePackReady':
      return { href: '/', label: 'Ver bandeja' };

    case 'ContentPlanReady':
      return isSoho
        ? { href: '/', label: 'Ver publicaciones' }
        : { href: '/strategy', label: 'Ver estrategia' };

    case 'PerformanceReport':
    case 'WeeklyBalance':
      return isSoho
        ? { href: '/agency-overview', label: 'Ver resumen' }
        : { href: '/dashboard', label: 'Ver métricas' };

    case 'AnomalyDetected':
      return { href: '/leads', label: 'Ver leads' };

    case 'PlanApproved':
    case 'StrategistPlanDraft':
    case 'PlanRevision':
      return isSoho
        ? { href: '/agency/activity', label: 'Ver actividad' }
        : { href: '/agency/strategy', label: 'Ver planes' };

    case 'QualifiedLeadBatch':
    case 'SentimentSignal':
      return { href: '/social/inbox', label: 'Ver inbox social' };

    default:
      return null;
  }
}
