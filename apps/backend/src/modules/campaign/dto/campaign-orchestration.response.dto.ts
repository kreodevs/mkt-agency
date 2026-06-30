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
  strategyAssignmentId: string;
  strategyStatus: string;
  linkedContentCount: number;
  platforms: string[];
  message: string;
}
