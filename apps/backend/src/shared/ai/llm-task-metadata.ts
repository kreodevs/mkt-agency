import type { LlmTaskType } from './llm-task-types';

export interface LlmTaskMetadata {
  label: string;
  description: string;
  defaultModel: string;
  temperature: string;
}

export const LLM_TASK_METADATA: Record<LlmTaskType, LlmTaskMetadata> = {
  section_suggestion: {
    label: 'Sugerencias de perfil',
    description: 'Completa secciones del perfil de empresa',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  campaign_strategy: {
    label: 'Estrategia de campaña',
    description: 'Genera estrategia y presupuestos de campaña',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  lead_scoring: {
    label: 'Scoring de leads',
    description: 'Puntúa leads del CRM',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.5',
  },
  proposal_generation: {
    label: 'Generación de propuestas',
    description: 'Redacta propuestas comerciales',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  report_generation: {
    label: 'Generación de reportes',
    description: 'Genera informes de marketing',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  brand_interview: {
    label: 'Brand Analyst',
    description: 'Entrevista guiada y Brand Brief',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  competitor_intel: {
    label: 'Competitor Intel',
    description: 'Análisis profundo de competidores',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  competitor_discovery: {
    label: 'Descubrimiento de competidores',
    description: 'Sugerencias IA de competidores',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  image_generation: {
    label: 'Generación de imágenes',
    description: 'Imágenes estáticas vía OpenRouter Image API',
    defaultModel: 'black-forest-labs/flux-2-pro',
    temperature: '0',
  },
  video_generation: {
    label: 'Generación de video',
    description: 'Clips MP4 para reels, GIFs y videos sociales vía OpenRouter Video API',
    defaultModel: 'bytedance/seedance-2.0-fast',
    temperature: '0',
  },
  strategy_adjustment: {
    label: 'Ajuste de estrategia',
    description: 'Recomendaciones de ajuste según métricas',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
  social_copy: {
    label: 'Copy para redes',
    description: 'Generación de copy para Community Manager',
    defaultModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.7',
  },
};
