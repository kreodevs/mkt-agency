import { estimateSpeechDurationSeconds } from './video-narration.utils';

export const MIN_VIDEO_DURATION = 4;
export const MAX_VIDEO_DURATION = 15;

export interface VideoDurationPolicy {
  minDuration: number;
  maxDuration: number;
  defaultDuration: number;
  truncateNarration: boolean;
}

const DEFAULT_VIDEO_DURATION_POLICY: VideoDurationPolicy = {
  minDuration: MIN_VIDEO_DURATION,
  maxDuration: MAX_VIDEO_DURATION,
  defaultDuration: 8,
  truncateNarration: false,
};

export function resolveVideoDurationPolicy(modelId?: string): VideoDurationPolicy {
  const id = modelId?.trim().toLowerCase() ?? '';

  if (id.includes('wan')) {
    return { minDuration: 2, maxDuration: 10, defaultDuration: 10, truncateNarration: true };
  }

  if (id.includes('veo-3.1')) {
    return { minDuration: 4, maxDuration: 8, defaultDuration: 8, truncateNarration: true };
  }

  return DEFAULT_VIDEO_DURATION_POLICY;
}

function clampVideoDuration(seconds: number, policy?: VideoDurationPolicy): number {
  const min = policy?.minDuration ?? MIN_VIDEO_DURATION;
  const max = policy?.maxDuration ?? MAX_VIDEO_DURATION;
  const fallback = policy?.defaultDuration ?? 8;

  if (!Number.isFinite(seconds)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(seconds)));
}

function resolveVideoDurationFromPrompt(prompt: string): number {
  const match = prompt.match(/\b(\d{1,2})\s*(?:s|seg|segundos?)\b/i);
  if (match) {
    const seconds = Number.parseInt(match[1], 10);
    if (seconds >= MIN_VIDEO_DURATION && seconds <= MAX_VIDEO_DURATION) {
      return seconds;
    }
  }

  if (/\bgif\b/i.test(prompt)) {
    return 5;
  }

  if (/\breel\b/i.test(prompt)) {
    return 10;
  }

  return 8;
}

export function resolveVideoDuration(
  prompt: string,
  narrationBody?: string,
  policy?: VideoDurationPolicy,
): number {
  const fromPrompt = resolveVideoDurationFromPrompt(prompt);

  if (!narrationBody?.trim()) {
    const target = fromPrompt === 8 && policy?.defaultDuration ? policy.defaultDuration : fromPrompt;
    return clampVideoDuration(target, policy);
  }

  const fromNarration = estimateSpeechDurationSeconds(narrationBody);
  if (fromNarration <= 0) {
    const target = fromPrompt === 8 && policy?.defaultDuration ? policy.defaultDuration : fromPrompt;
    return clampVideoDuration(target, policy);
  }

  return clampVideoDuration(Math.max(fromPrompt, fromNarration), policy);
}

export function resolveVideoAspectRatio(prompt: string): string {
  if (/\b(story|stories|reel|reels|vertical|9:16|tiktok|instagram)\b/i.test(prompt)) {
    return '9:16';
  }

  if (/\b(horizontal|landscape|16:9|youtube|linkedin)\b/i.test(prompt)) {
    return '16:9';
  }

  return '9:16';
}
