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
