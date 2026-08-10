export interface ExecutiveSuggestion {
  id: string;
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  requiresApproval: true;
}

export interface ExecutiveWeeklyReportPayload {
  periodDays: number;
  generatedAt: string;
  headline: string;
  executiveSummary: string;
  keyMetrics: Record<string, string | number>;
  paidMediaInsight: string | null;
  suggestions: ExecutiveSuggestion[];
  fallback?: boolean;
}
