import type { AgentInterview } from '@/types/agents';

export function hasBrandBriefResult(
  interview: Pick<AgentInterview, 'brandBriefMarkdown' | 'brandBrief'>,
): boolean {
  if (interview.brandBriefMarkdown?.trim()) {
    return true;
  }
  return interview.brandBrief != null && Object.keys(interview.brandBrief).length > 0;
}

/** Entrevistas con brief generado no deben mostrarse como fallidas en UI. */
export function getEffectiveInterviewStatus(
  interview: AgentInterview,
): AgentInterview['status'] {
  if (interview.status === 'failed' && hasBrandBriefResult(interview)) {
    return 'completed';
  }
  return interview.status;
}

export function isLegacyManualInterview(interview: AgentInterview): boolean {
  return (
    interview.agentType === 'brand_interview' &&
    interview.status === 'in_progress' &&
    interview.currentStep < interview.totalSteps &&
    !isOnboardingSourcedInterview(interview)
  );
}

export function isOnboardingSourcedInterview(interview: AgentInterview): boolean {
  return interview.messages.some((message) => message.metadata?.type === 'onboarding_skip');
}
