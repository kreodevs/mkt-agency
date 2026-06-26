export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type SslStatus = 'pending' | 'processing' | 'active' | 'failed';
export type DnsVerificationType = 'cname' | 'txt';

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'pending',
  'verified',
  'failed',
];

export const SSL_STATUSES: SslStatus[] = [
  'pending',
  'processing',
  'active',
  'failed',
];

export const DOMAIN_NAME_PATTERN =
  /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export const TXT_VERIFICATION_PREFIX = '_mktos-verify';
