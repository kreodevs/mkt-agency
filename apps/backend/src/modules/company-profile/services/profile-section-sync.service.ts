import { Injectable } from '@nestjs/common';
import { SectionKey } from '../domain/section-keys';
import { CompanyProfileSectionEntity } from '../infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from '../infrastructure/typeorm/company-profile.entity';

export interface ResolvedProfileValues {
  companyName: string | null;
  industry: string | null;
  website: string | null;
  brandVoice: string | null;
  targetAudienceDesc: string | null;
  competitors: string | null;
  objectives: string[];
  visualPreferences: Record<string, unknown>;
}

@Injectable()
export class ProfileSectionSyncService {
  applySectionToProfile(
    profile: CompanyProfileEntity,
    sectionKey: SectionKey,
    data: Record<string, unknown>,
  ): void {
    switch (sectionKey) {
      case 'company_name':
        profile.companyName = readString(data.companyName) ?? profile.companyName;
        break;
      case 'industry':
        profile.industry = readString(data.industry) ?? profile.industry;
        break;
      case 'website':
        profile.website = readString(data.website) ?? profile.website;
        break;
      case 'brand_voice':
        profile.brandVoice = readString(data.brandVoice) ?? profile.brandVoice;
        break;
      case 'target_audience_desc':
        profile.targetAudienceDesc =
          readString(data.targetAudienceDesc) ?? profile.targetAudienceDesc;
        break;
      case 'competitors':
        profile.competitors = readString(data.competitors) ?? profile.competitors;
        break;
      case 'objectives':
        profile.objectives = readObjectives(data.objectives) ?? profile.objectives;
        break;
      case 'visual_preferences':
        profile.visualPreferences = {
          ...profile.visualPreferences,
          ...pickVisualPreferences(data),
        };
        break;
    }
  }

  syncProfileFromSections(
    profile: CompanyProfileEntity,
    sections: CompanyProfileSectionEntity[],
  ): void {
    for (const section of sections) {
      this.applySectionToProfile(
        profile,
        section.sectionKey as SectionKey,
        (section.data ?? {}) as Record<string, unknown>,
      );
    }
  }

  resolveProfileValues(
    profile: CompanyProfileEntity | null | undefined,
    sections: CompanyProfileSectionEntity[] = [],
  ): ResolvedProfileValues {
    const sectionData = (key: SectionKey): Record<string, unknown> => {
      const section = sections.find((item) => item.sectionKey === key);
      return (section?.data ?? {}) as Record<string, unknown>;
    };

    const profileObjectives = Array.isArray(profile?.objectives)
      ? profile!.objectives.map(String).filter(Boolean)
      : [];

    return {
      companyName:
        readString(profile?.companyName) ?? readString(sectionData('company_name').companyName),
      industry:
        readString(profile?.industry) ?? readString(sectionData('industry').industry),
      website: readString(profile?.website) ?? readString(sectionData('website').website),
      brandVoice:
        readString(profile?.brandVoice) ?? readString(sectionData('brand_voice').brandVoice),
      targetAudienceDesc:
        readString(profile?.targetAudienceDesc) ??
        readString(sectionData('target_audience_desc').targetAudienceDesc),
      competitors:
        readString(profile?.competitors) ?? readString(sectionData('competitors').competitors),
      objectives:
        profileObjectives.length > 0
          ? profileObjectives
          : (readObjectives(sectionData('objectives').objectives) ?? []),
      visualPreferences: {
        ...(profile?.visualPreferences ?? {}),
        ...pickVisualPreferences(sectionData('visual_preferences')),
      },
    };
  }
}

export function isCompanyProfileReady(
  profile: CompanyProfileEntity | null | undefined,
  sections: CompanyProfileSectionEntity[] = [],
  resolved?: ResolvedProfileValues,
): boolean {
  if (!profile) {
    return false;
  }

  if (profile.status === 'completed') {
    return true;
  }

  const values =
    resolved ?? new ProfileSectionSyncService().resolveProfileValues(profile, sections);

  return (
    !!values.companyName?.trim() &&
    !!values.industry?.trim() &&
    !!values.website?.trim() &&
    !!values.brandVoice?.trim() &&
    !!values.targetAudienceDesc?.trim()
  );
}

function readString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
}

function readObjectives(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const items = value.map(String).map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items : null;
  }

  if (typeof value === 'string') {
    const items = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return items.length > 0 ? items : null;
  }

  return null;
}

function pickVisualPreferences(data: Record<string, unknown>): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const key of ['style', 'primaryColor']) {
    const value = data[key];
    if (value != null && String(value).trim() !== '') {
      picked[key] = String(value).trim();
    }
  }
  return picked;
}
