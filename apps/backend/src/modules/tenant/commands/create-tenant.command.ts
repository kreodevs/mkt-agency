import { BadRequestException } from '@nestjs/common';

export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly packageId: string,
    public readonly ownerEmail: string,
    public readonly ownerPassword: string,
    public readonly ownerName: string,
  ) {
    if (!packageId?.trim()) {
      throw new BadRequestException({
        error: 'packageId is required',
        code: 'VALIDATION_ERROR',
      });
    }
  }
}

export interface CreateTenantResult {
  id: string;
  name: string;
  slug: string;
  plan: string;
  packageId: string | null;
  status: string;
  settings: Record<string, unknown>;
  maxUsers: number;
  maxAssetsSize: number;
  maxFileSize: number;
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
