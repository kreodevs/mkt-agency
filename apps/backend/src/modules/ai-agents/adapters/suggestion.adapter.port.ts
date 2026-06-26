import { SectionKey } from '../../company-profile/domain/section-keys';

export interface SuggestionContext {
  sectionKey: SectionKey;
  tenantId: string;
  profile: {
    companyName?: string | null;
    industry?: string | null;
    website?: string | null;
    brandVoice?: string | null;
    targetAudienceDesc?: string | null;
  };
  currentSectionData: Record<string, unknown>;
}

export interface SuggestionAdapterPort {
  generate(context: SuggestionContext): Promise<Record<string, unknown>>;
}

export const SUGGESTION_ADAPTER = Symbol('SUGGESTION_ADAPTER');
