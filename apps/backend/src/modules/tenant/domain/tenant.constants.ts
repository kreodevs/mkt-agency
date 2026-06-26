export const ALLOWED_TENANT_PLANS = [
  'starter',
  'professional',
  'enterprise',
] as const;

export type TenantPlan = (typeof ALLOWED_TENANT_PLANS)[number];

export const ALLOWED_TENANT_STATUSES = [
  'active',
  'suspended',
  'deleted',
] as const;

export type TenantStatus = (typeof ALLOWED_TENANT_STATUSES)[number];
