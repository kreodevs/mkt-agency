import { BadRequestException } from '@nestjs/common';
import { ALLOWED_TENANT_PLANS } from '../domain/tenant.constants';

export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly plan: string,
    public readonly ownerEmail: string,
    public readonly ownerPassword: string,
    public readonly ownerName: string,
  ) {
    if (!ALLOWED_TENANT_PLANS.includes(plan as (typeof ALLOWED_TENANT_PLANS)[number])) {
      throw new BadRequestException({
        error: 'Invalid tenant plan',
        code: 'VALIDATION_ERROR',
        details: `Allowed plans: ${ALLOWED_TENANT_PLANS.join(', ')}`,
      });
    }
  }
}

export interface CreateTenantResult {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  maxUsers: number;
  maxAssetsSize: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}
