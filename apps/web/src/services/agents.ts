import { apiFetch } from '@/services/api';
import type { AgentInterview } from '@/types/agents';

export async function listInterviews(): Promise<AgentInterview[]> {
  return apiFetch<AgentInterview[]>('/agents/interviews');
}

export async function createInterview(agentType: string): Promise<AgentInterview> {
  return apiFetch<AgentInterview>('/agents/interviews', {
    method: 'POST',
    body: JSON.stringify({ agentType }),
  });
}

export async function getInterview(id: string): Promise<AgentInterview> {
  return apiFetch<AgentInterview>(`/agents/interviews/${id}`);
}

export async function submitAnswer(
  interviewId: string,
  answer: string,
): Promise<AgentInterview> {
  return apiFetch<AgentInterview>(`/agents/interviews/${interviewId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}