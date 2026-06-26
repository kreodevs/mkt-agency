import { apiFetch } from '@/services/api';
import type {
  CompanyProfile,
  CompanyProfileSection,
  SectionKey,
  SuggestSectionResponse,
  SuggestionAssignmentResponse,
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

export async function requestSectionSuggestion(
  sectionKey: SectionKey,
): Promise<SuggestSectionResponse> {
  return apiFetch<SuggestSectionResponse>(`/company-profile/sections/${sectionKey}/suggest`, {
    method: 'POST',
  });
}

export async function getSuggestionAssignment(
  assignmentId: string,
): Promise<SuggestionAssignmentResponse> {
  return apiFetch<SuggestionAssignmentResponse>(
    `/company-profile/suggestions/${assignmentId}`,
  );
}
