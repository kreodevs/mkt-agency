import { apiFetch } from '@/services/api';
import type {
  CreateProposalPayload,
  CreateProposalResponse,
  PaginatedProposalsResponse,
  Proposal,
  ProposalStatus,
} from '@/types/proposals';

export interface ListProposalsParams {
  campaignId?: string;
  status?: ProposalStatus;
  page?: number;
  limit?: number;
}

function buildQuery(params: ListProposalsParams): string {
  const search = new URLSearchParams();
  if (params.campaignId) search.set('campaignId', params.campaignId);
  if (params.status) search.set('status', params.status);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listProposals(
  params: ListProposalsParams = {},
): Promise<PaginatedProposalsResponse> {
  return apiFetch<PaginatedProposalsResponse>(`/proposals${buildQuery(params)}`);
}

export async function getProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}`);
}

export async function createProposal(
  payload: CreateProposalPayload,
): Promise<CreateProposalResponse> {
  return apiFetch<CreateProposalResponse>('/proposals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signProposal(id: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}/sign`, { method: 'POST' });
}

export async function rejectProposal(id: string, reason?: string): Promise<Proposal> {
  return apiFetch<Proposal>(`/proposals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason ?? undefined }),
  });
}
