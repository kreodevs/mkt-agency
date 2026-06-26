export type ProposalStatus =
  | 'generating'
  | 'draft'
  | 'reviewing'
  | 'accepted'
  | 'rejected'
  | 'failed';

export interface ProposalContent {
  summary?: string;
  objectives?: string[];
  strategy?: string;
  budget?: {
    total: number;
    breakdown?: Array<{ item: string; amount: number }>;
  };
  timeline?: Array<{ phase: string; duration: string }>;
  deliverables?: string[];
  error?: string;
  rejectionReason?: string;
}

export interface Proposal {
  id: string;
  tenantId: string;
  campaignId: string | null;
  title: string;
  content: ProposalContent;
  status: ProposalStatus;
  signatureHash: string | null;
  signedBy: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProposalsResponse {
  items: Proposal[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProposalPayload {
  title: string;
  campaignId?: string;
}

export interface CreateProposalResponse {
  id: string;
  status: ProposalStatus;
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  generating: 'Generando',
  draft: 'Borrador',
  reviewing: 'En revisión',
  accepted: 'Firmada',
  rejected: 'Rechazada',
  failed: 'Error',
};

export function proposalStatusVariant(
  status: ProposalStatus,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  if (status === 'accepted') return 'success';
  if (status === 'generating' || status === 'reviewing') return 'info';
  if (status === 'rejected' || status === 'failed') return 'error';
  if (status === 'draft') return 'warning';
  return 'neutral';
}
