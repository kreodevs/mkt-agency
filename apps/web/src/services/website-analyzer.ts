import { apiFetch } from '@/services/api';

export interface WebsiteAnalysisResult {
  companyName: string;
  industry: string;
  website: string;
  description: string;
  targetAudience: string;
  valueProposition: string;
  brandVoice: string;
  productsServices: string;
  competitors: string;
  marketingObjectives: string;
  socialMediaChannels: string[];
  extractedFrom: string;
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysisResult> {
  return apiFetch<WebsiteAnalysisResult>('/agents/analyze-website', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}