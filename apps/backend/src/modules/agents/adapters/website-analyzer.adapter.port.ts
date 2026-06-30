export interface WebsiteAnalysisResult {
  companyName: string;
  industry: string;
  website: string;
  description: string;
  targetAudience: string;
  valueProposition: string;
  brandVoice: string;
  productsServices: string;
  seoTags?: {
    title: string;
    description: string;
    keywords: string[];
    h1: string;
    focusKeyphrase?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  competitors: string;
  marketingObjectives: string;
  socialMediaChannels: string[];
  extractedFrom: string;
}

export interface WebsiteAnalyzerAdapterPort {
  analyze(url: string): Promise<WebsiteAnalysisResult>;
}

export const WEBSITE_ANALYZER_ADAPTER = Symbol('WEBSITE_ANALYZER_ADAPTER');