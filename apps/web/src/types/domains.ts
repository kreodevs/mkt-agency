export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type SslStatus = 'pending' | 'processing' | 'active' | 'failed';

export interface CustomDomain {
  id: string;
  domain: string;
  cnameValue: string | null;
  verificationToken: string | null;
  verificationStatus: VerificationStatus;
  sslStatus: SslStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DomainListResponse {
  items: CustomDomain[];
}

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  failed: 'Fallido',
};

export const SSL_STATUS_LABELS: Record<SslStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  active: 'Activo',
  failed: 'Fallido',
};
