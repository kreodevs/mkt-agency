import {
  AuthUserRecord,
  CreatedSuperadmin,
  CreateSuperadminParams,
  CreatedTenantOwner,
  CreateTenantOwnerParams,
  PublicUserRecord,
} from './user.types';

export type {
  AuthUserRecord,
  PublicUserRecord,
  CreatedSuperadmin,
  CreateSuperadminParams,
  CreatedTenantOwner,
  CreateTenantOwnerParams,
} from './user.types';

export interface UserRepositoryPort {
  countSuperadmins(): Promise<number>;
  createSuperadmin(params: CreateSuperadminParams): Promise<CreatedSuperadmin>;
  createTenantOwner(params: CreateTenantOwnerParams): Promise<CreatedTenantOwner>;
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findPublicById(id: string): Promise<PublicUserRecord | null>;
  findPublicByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<PublicUserRecord | null>;
  incrementLoginAttempts(userId: string): Promise<number>;
  resetLoginAttempts(userId: string): Promise<void>;
  lockUntil(userId: string, until: Date): Promise<void>;
  updateName(userId: string, name: string): Promise<PublicUserRecord | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
