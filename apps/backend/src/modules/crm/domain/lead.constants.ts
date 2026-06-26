export const LEAD_STAGES = ['prospect', 'qualified', 'proposal', 'customer', 'lost'] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];
