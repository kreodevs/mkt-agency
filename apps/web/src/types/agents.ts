export interface InterviewMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AgentInterview {
  id: string;
  agentType: string;
  status: 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  messages: InterviewMessage[];
  brandBrief: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AGENTS_CATALOG = [
  {
    id: 'brand_interview',
    name: 'Brand Analyst',
    description:
      'Entrevista guiada que analiza tu marca, audiencia, competencia y objetivos de marketing para generar un Brand Brief profesional.',
    icon: 'Bot',
    href: '/agents/brand-interview',
    status: 'ready' as const,
    color: 'from-violet-500 to-purple-600',
  },
];