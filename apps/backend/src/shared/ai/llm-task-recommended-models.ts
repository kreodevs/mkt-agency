import { OPENROUTER_FLUX_2_PRO_MODEL } from '../social/openrouter-image-model.util';
import type { LlmTaskType } from './llm-task-types';

export type RecommendedLlmProviderSlug = 'openrouter' | 'elevenlabs' | 'replicate';

export interface RecommendedLlmTaskModel {
  model: string;
  fallbackModel: string | null;
  temperature: string;
  providerSlug: RecommendedLlmProviderSlug;
}

/** Modelos económicos con mejor calidad que variantes :free (OpenRouter + proveedores nativos). */
export const RECOMMENDED_LLM_TASK_MODELS: Record<LlmTaskType, RecommendedLlmTaskModel> = {
  social_copy: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-3.5-flash',
    temperature: '0.60',
    providerSlug: 'openrouter',
  },
  brand_interview: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-2.5-flash-lite',
    temperature: '0.50',
    providerSlug: 'openrouter',
  },
  campaign_strategy: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'qwen/qwen3.5-flash',
    temperature: '0.70',
    providerSlug: 'openrouter',
  },
  competitor_intel: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-3.5-flash',
    temperature: '0.40',
    providerSlug: 'openrouter',
  },
  competitor_discovery: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-2.5-flash-lite',
    temperature: '0.30',
    providerSlug: 'openrouter',
  },
  lead_scoring: {
    model: 'qwen/qwen3.5-flash',
    fallbackModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.50',
    providerSlug: 'openrouter',
  },
  proposal_generation: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-3.5-flash',
    temperature: '0.70',
    providerSlug: 'openrouter',
  },
  report_generation: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: 'google/gemini-3.5-flash',
    temperature: '0.70',
    providerSlug: 'openrouter',
  },
  section_suggestion: {
    model: 'qwen/qwen3.5-flash',
    fallbackModel: 'deepseek/deepseek-v4-flash',
    temperature: '0.70',
    providerSlug: 'openrouter',
  },
  strategy_adjustment: {
    model: 'deepseek/deepseek-v4-flash',
    fallbackModel: null,
    temperature: '0.45',
    providerSlug: 'openrouter',
  },
  image_generation: {
    model: OPENROUTER_FLUX_2_PRO_MODEL,
    fallbackModel: 'bytedance-seed/seedream-4.5',
    temperature: '0',
    providerSlug: 'openrouter',
  },
  video_generation: {
    model: 'bytedance/seedance-2.0-fast',
    fallbackModel: 'alibaba/wan-2.7',
    temperature: '0',
    providerSlug: 'openrouter',
  },
  tts_generation: {
    model: 'eleven_multilingual_v2',
    fallbackModel: 'hexgrad/kokoro-82m',
    temperature: '0',
    providerSlug: 'elevenlabs',
  },
  talking_head_generation: {
    model: 'prunaai/p-video-avatar',
    fallbackModel: null,
    temperature: '0',
    providerSlug: 'replicate',
  },
  cm_portrait_generation: {
    model: OPENROUTER_FLUX_2_PRO_MODEL,
    fallbackModel: null,
    temperature: '0',
    providerSlug: 'openrouter',
  },
};
