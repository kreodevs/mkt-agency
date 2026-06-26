import type { SslStatus, VerificationStatus } from '../domain/domain.constants';

export class DomainResponseDto {
  id!: string;
  domain!: string;
  cnameValue!: string | null;
  verificationToken!: string | null;
  verificationStatus!: VerificationStatus;
  sslStatus!: SslStatus;
  isActive!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class DomainListResponseDto {
  items!: DomainResponseDto[];
}
