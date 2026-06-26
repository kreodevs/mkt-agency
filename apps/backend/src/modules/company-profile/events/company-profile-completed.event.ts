export class CompanyProfileCompletedEvent {
  static readonly eventType = 'CompanyProfileCompleted';

  static createPayload(params: {
    profileId: string;
    tenantId: string;
    completionPercentage: number;
  }): Record<string, unknown> {
    return {
      profileId: params.profileId,
      tenantId: params.tenantId,
      completionPercentage: params.completionPercentage,
      completedAt: new Date().toISOString(),
    };
  }
}
