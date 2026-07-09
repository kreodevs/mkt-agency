export const AGENT_EVENT_TYPES = [
  'ContentPlanReady',
  'ContentBrief',
  'CreativePackReady',
  'PlanApproved',
  'CreativeBrief',
  'CampaignLive',
  'PerformanceReport',
  'AnomalyDetected',
  'QualifiedLeadBatch',
  'SentimentSignal',
  'PlanRevision',
  'WeeklyBalance',
  'SohoWeekPrepared',
  'StrategistPlanDraft',
] as const;

export type AgentEventType = (typeof AGENT_EVENT_TYPES)[number];

export const AGENT_EVENT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
] as const;

export type AgentEventStatus = (typeof AGENT_EVENT_STATUSES)[number];
