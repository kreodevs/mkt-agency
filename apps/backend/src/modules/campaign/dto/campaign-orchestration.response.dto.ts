export interface AgentReadinessItem {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  href: string;
  required: boolean;
}

export interface CampaignAgentReadinessResponse {
  ready: boolean;
  mode: 'organic' | 'paid';
  completed: number;
  total: number;
  requiredCompleted: number;
  requiredTotal: number;
  items: AgentReadinessItem[];
  deliverables: string[];
}

export interface AutoGenerateCampaignResponse {
  campaignId: string;
  campaignName: string;
  executionMode: 'organic' | 'paid';
  strategyAssignmentId: string | null;
  strategyStatus: string | null;
  linkedContentCount: number;
  platforms: string[];
  message: string;
}
