export const LLM_TASK_TYPES = [
  'section_suggestion',
  'campaign_strategy',
  'lead_scoring',
  'proposal_generation',
  'report_generation',
] as const;

export type LlmTaskType = (typeof LLM_TASK_TYPES)[number];

export interface ResolvedLlmConfig {
  taskType: LlmTaskType;
  provider: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPromptTemplate?: string | null;
  enabled: boolean;
}
