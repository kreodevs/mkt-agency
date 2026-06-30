import { apiFetch } from '@/services/api';
import type { AgentInterview, CompetitorAnalysis, ImageGeneration } from '@/types/agents';

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

export async function retryBrandBrief(interviewId: string): Promise<AgentInterview> {
  return apiFetch<AgentInterview>(`/agents/interviews/${interviewId}/retry-brief`, {
    method: 'POST',
  });
}

// Competitor Intel
export async function listCompetitorAnalyses(): Promise<CompetitorAnalysis[]> {
  return apiFetch<CompetitorAnalysis[]>('/agents/competitor-intel');
}

export async function triggerCompetitorAnalysis(competitors?: string): Promise<CompetitorAnalysis> {
  return apiFetch<CompetitorAnalysis>('/agents/competitor-intel', {
    method: 'POST',
    body: JSON.stringify({ competitors }),
  });
}

export async function getCompetitorAnalysis(id: string): Promise<CompetitorAnalysis> {
  return apiFetch<CompetitorAnalysis>(`/agents/competitor-intel/${id}`);
}

// Image Generation
export async function listImageGenerations(): Promise<ImageGeneration[]> {
  return apiFetch<ImageGeneration[]>('/agents/image-generation');
}

export async function generateImage(payload: { prompt: string; style?: string; size?: string }): Promise<ImageGeneration> {
  return apiFetch<ImageGeneration>('/agents/image-generation', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getImageGeneration(id: string): Promise<ImageGeneration> {
  return apiFetch<ImageGeneration>(`/agents/image-generation/${id}`);
}