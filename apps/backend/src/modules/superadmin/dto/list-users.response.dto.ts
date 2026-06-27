import { PublicUserRecord } from '../../../shared/domain/user.types';

export interface UserWithTenant extends PublicUserRecord {
  status: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListUsersResponseDto {
  items: UserWithTenant[];
  total: number;
  page: number;
  limit: number;
}