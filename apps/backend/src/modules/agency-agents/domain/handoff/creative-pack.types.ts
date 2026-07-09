export interface CreativeHypothesis {
  id: string;
  painPoint: string;
  angle: string;
  expectedLift: string;
}

export interface AdCopyItem {
  hypothesisId: string;
  platform: string;
  format: 'static' | 'video' | 'carousel';
  headline: string;
  primaryText: string;
  cta: string;
  visualDirection: string;
}

export interface CreativePackPayload {
  planId?: string;
  hypotheses: CreativeHypothesis[];
  adCopies: AdCopyItem[];
  scripts?: Array<{
    hypothesisId: string;
    durationSec: number;
    scenes: string[];
  }>;
}

export interface ContentBriefPayload {
  topics: string[];
  tone?: string;
  platforms: string[];
  productId?: string;
  objective?: string;
}
