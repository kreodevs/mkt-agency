import type { LlmTaskType } from './llm-task-types';
import { RECOMMENDED_LLM_TASK_MODELS } from './llm-task-recommended-models';

export interface LlmTaskMetadata {
  label: string;
  description: string;
  defaultModel: string;
  defaultFallbackModel?: string | null;
  temperature: string;
  providerSlug: 'openrouter' | 'elevenlabs' | 'replicate';
}

const TASK_LABELS: Record<
  LlmTaskType,
  Pick<LlmTaskMetadata, 'label' | 'description'>
> = {
  section_suggestion: {
    label: 'Sugerencias de perfil',
    description: 'Completa secciones del perfil de empresa',
  },
  campaign_strategy: {
    label: 'Estrategia de campaña',
    description: 'Genera estrategia y presupuestos de campaña',
  },
  lead_scoring: {
    label: 'Scoring de leads',
    description: 'Puntúa leads del CRM',
  },
  proposal_generation: {
    label: 'Generación de propuestas',
    description: 'Redacta propuestas comerciales',
  },
  report_generation: {
    label: 'Generación de reportes',
    description: 'Genera informes de marketing',
  },
  brand_interview: {
    label: 'Brand Analyst',
    description: 'Entrevista guiada y Brand Brief',
  },
  competitor_intel: {
    label: 'Competitor Intel',
    description: 'Análisis profundo de competidores',
  },
  competitor_discovery: {
    label: 'Descubrimiento de competidores',
    description: 'Sugerencias IA de competidores',
  },
  image_generation: {
    label: 'Generación de imágenes',
    description: 'Imágenes estáticas vía OpenRouter Image API',
  },
  video_generation: {
    label: 'Generación de video (deshabilitada)',
    description: 'Reservado; la app no genera video por IA. Futuro: composición FFmpeg con material del kit.',
  },
  tts_generation: {
    label: 'Síntesis de voz (TTS)',
    description: 'Narración en español para reels de la CM virtual',
  },
  talking_head_generation: {
    label: 'Avatar hablante (lip-sync)',
    description: 'Anima el retrato de la CM con audio TTS (Replicate p-video-avatar)',
  },
  cm_portrait_generation: {
    label: 'Retrato CM virtual',
    description: 'Retrato vertical 9:16 de la community manager para lip-sync',
  },
  strategy_adjustment: {
    label: 'Ajuste de estrategia',
    description: 'Recomendaciones de ajuste según métricas',
  },
  social_copy: {
    label: 'Copy para redes',
    description: 'Generación de copy para Community Manager',
  },
};

export const LLM_TASK_METADATA: Record<LlmTaskType, LlmTaskMetadata> = Object.fromEntries(
  (Object.keys(TASK_LABELS) as LlmTaskType[]).map((taskType) => {
    const labels = TASK_LABELS[taskType];
    const recommended = RECOMMENDED_LLM_TASK_MODELS[taskType];
    return [
      taskType,
      {
        ...labels,
        defaultModel: recommended.model,
        defaultFallbackModel: recommended.fallbackModel,
        temperature: recommended.temperature,
        providerSlug: recommended.providerSlug,
      },
    ];
  }),
) as Record<LlmTaskType, LlmTaskMetadata>;
