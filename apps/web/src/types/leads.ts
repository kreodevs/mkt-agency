import type { LeadStage } from './lead.constants';

export type { LeadStage };

export interface LeadInteraction {
  id: string;
  leadId: string;
  type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  score: number;
  stage: LeadStage;
  metadata: Record<string, unknown>;
  formSubmissionId: string | null;
  createdAt: string;
  updatedAt: string;
  recentInteractions?: LeadInteraction[];
}

export interface PaginatedLeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadInteractionsListResponse {
  items: LeadInteraction[];
  total: number;
}

export interface ListLeadsParams {
  stage?: LeadStage;
  minScore?: number;
  formId?: string;
  page?: number;
  limit?: number;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ChangeLeadStagePayload {
  stage: LeadStage;
  note?: string;
}

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  prospect: 'Prospecto',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  customer: 'Cliente',
  lost: 'Perdido',
};

export const LEAD_KANBAN_COLUMNS: Array<{ id: LeadStage; title: string }> = [
  { id: 'prospect', title: 'Prospecto' },
  { id: 'qualified', title: 'Calificado' },
  { id: 'proposal', title: 'Propuesta' },
  { id: 'customer', title: 'Cliente' },
  { id: 'lost', title: 'Perdido' },
];
