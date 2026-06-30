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
  productId: string | null;
  productName: string | null;
  status: 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  messages: InterviewMessage[];
  brandBrief: Record<string, unknown> | null;
  brandBriefMarkdown: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorAnalysis {
  id: string;
  tenantId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  competitorsInput: string | null;
  analysis: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageGeneration {
  id: string;
  tenantId: string;
  prompt: string;
  status: string;
  imageUrl: string | null;
  assetId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  status: 'ready' | 'coming_soon';
  color: string;
}

export const AGENTS_CATALOG: AgentCatalogItem[] = [
  {
    id: 'brand_interview',
    name: 'Brand Analyst',
    description:
      'Entrevista guiada que analiza tu marca, audiencia, competencia y objetivos de marketing para generar un Brand Brief profesional.',
    icon: 'Bot',
    href: '/agents/brand-interview',
    status: 'ready',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'competitor_intel',
    name: 'Competitor Intel',
    description:
      'Analiza en profundidad a tus competidores: fortalezas, debilidades, posicionamiento y oportunidades de mercado.',
    icon: 'Target',
    href: '/agents/competitor-intel',
    status: 'ready',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'image_generation',
    name: 'Image Generator',
    description:
      'Genera imágenes para tus campañas con IA. Describe lo que necesitas y elige estilo y tamaño.',
    icon: 'Image',
    href: '/agents/image-generator',
    status: 'ready',
    color: 'from-pink-500 to-rose-600',
  },
];