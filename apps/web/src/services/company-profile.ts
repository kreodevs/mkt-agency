import { apiFetch } from '@/services/api';
import type {
  CompanyProfile,
  CompanyProfileSection,
  SectionKey,
  UpdateSectionResponse,
} from '@/types/company-profile';

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return apiFetch<CompanyProfile>('/company-profile');
}

export async function listCompanyProfileSections(): Promise<CompanyProfileSection[]> {
  return apiFetch<CompanyProfileSection[]>('/company-profile/sections');
}

export async function updateCompanyProfileSection(
  sectionKey: SectionKey,
  data: Record<string, unknown>,
): Promise<UpdateSectionResponse> {
  return apiFetch<UpdateSectionResponse>(`/company-profile/sections/${sectionKey}`, {
    method: 'PATCH',
    body: JSON.stringify({ data }),
  });
}
