export interface StrategistCommercialObjective {
  metric: 'revenue' | 'margin' | 'roi' | 'leads' | 'awareness';
  target: number;
  unit: 'percent' | 'absolute' | 'count';
  horizon: string;
}

export interface StrategistFunnelStage {
  stage: 'awareness' | 'consideration' | 'conversion' | 'retention';
  channels: string[];
  budgetPercent: number;
  kpi: string;
}

export interface StrategistPlanPayload {
  commercialObjective: StrategistCommercialObjective;
  funnelStages: StrategistFunnelStage[];
  channelRecommendations: Array<{
    channel: string;
    rationale: string;
    priority: number;
  }>;
  constraints: {
    maxCpa?: number;
    minRoas?: number;
  };
  rationale?: string;
}
