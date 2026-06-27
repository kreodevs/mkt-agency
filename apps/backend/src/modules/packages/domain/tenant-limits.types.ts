export interface TenantLimitsSnapshot {
  tenantId: string;
  packageId: string | null;
  packageName: string | null;
  packageSlug: string | null;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
  maxCampaigns: number | null;
  maxAiRequestsPerDay: number | null;
  features: Record<string, unknown>;
  usage: {
    users: number;
    assetsBytes: number;
    campaigns: number;
  };
}
