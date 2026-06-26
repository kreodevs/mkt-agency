import { apiFetch } from '@/services/api';
import type { CustomDomain, DomainListResponse } from '@/types/domains';

export async function listDomains(): Promise<DomainListResponse> {
  return apiFetch<DomainListResponse>('/domains');
}

export async function getDomain(id: string): Promise<CustomDomain> {
  return apiFetch<CustomDomain>(`/domains/${id}`);
}

export async function createDomain(domain: string): Promise<CustomDomain> {
  return apiFetch<CustomDomain>('/domains', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  });
}

export async function verifyDomainDns(id: string): Promise<CustomDomain> {
  return apiFetch<CustomDomain>(`/domains/${id}/verify-dns`, {
    method: 'POST',
  });
}

export async function deleteDomain(id: string): Promise<void> {
  return apiFetch<void>(`/domains/${id}`, { method: 'DELETE' });
}
