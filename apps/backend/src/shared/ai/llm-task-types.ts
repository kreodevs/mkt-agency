export const LLM_TASK_TYPES = [
  'section_suggestion',
  'campaign_strategy',
  'lead_scoring',
  'proposal_generation',
  'report_generation',
  'brand_interview',
  'competitor_intel',
  'competitor_discovery',
  'image_generation',
  'strategy_adjustment',
  'social_copy',
] as const;

export type LlmTaskType = (typeof LLM_TASK_TYPES)[number];

export interface LlmTaskConfigResponse {
  taskType: LlmTaskType;
  label: string;
  description?: string | null;
  providerId: string | null;
  providerName: string | null;
  providerSlug: string | null;
  model: string;
  fallbackModel?: string | null;
  temperature: number;
  maxTokens?: number;
  systemPromptTemplate?: string | null;
  enabled: boolean;
}

export interface ResolvedLlmExecutionConfig extends LlmTaskConfigResponse {
  apiUrl: string;
  apiKey: string;
}

export interface LlmProviderResponse {
  id: string;
  slug: string;
  name: string;
  apiUrl: string;
  defaultModel: string | null;
  apiKeyConfigured: boolean;
  apiKeyHint: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
