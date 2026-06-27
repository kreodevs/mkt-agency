import {
  AuthUserRecord,
  CreatedSuperadmin,
  CreateSuperadminParams,
  CreatedTenantOwner,
  CreateTenantOwnerParams,
  PublicUserRecord,
  ListUsersParams,
  ListUsersResult,
  UserWithTenant,
  UpdateUserByRepo,
} from './user.types';

export type {
  AuthUserRecord,
  PublicUserRecord,
  CreatedSuperadmin,
  CreateSuperadminParams,
  CreatedTenantOwner,
  CreateTenantOwnerParams,
  ListUsersParams,
  ListUsersResult,
  UserWithTenant,
  UpdateUserByRepo,
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
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  clearTenantId(userId: string): Promise<void>;
  findAll(params: ListUsersParams): Promise<ListUsersResult>;
  updateById(userId: string, data: UpdateUserByRepo): Promise<UserWithTenant | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
