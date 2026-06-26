export type CompanyProfileStatus = 'pending' | 'completed';

export type SectionKey =
  | 'company_name'
  | 'industry'
  | 'website'
  | 'brand_voice'
  | 'target_audience_desc'
  | 'competitors'
  | 'objectives'
  | 'visual_preferences';

export interface CompanyProfile {
  id: string;
  tenantId: string;
  companyName: string | null;
  industry: string | null;
  website: string | null;
  brandVoice: string | null;
  targetAudienceDesc: string | null;
  competitors: string | null;
  objectives: unknown[] | null;
  visualPreferences: Record<string, unknown> | null;
  completionPercentage: number;
  status: CompanyProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileSection {
  sectionKey: SectionKey;
  data: Record<string, unknown>;
  isCompleted: boolean;
  isMandatory: boolean;
  updatedAt: string;
}

export interface UpdateSectionResponse {
  sectionKey: string;
  data: Record<string, unknown>;
  isCompleted: boolean;
  completionPercentage: number;
  status: CompanyProfileStatus;
}
