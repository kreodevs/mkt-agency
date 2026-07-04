import { Injectable, Logger } from '@nestjs/common';
import { LlmConfigService } from '../../../shared/ai/llm-config.service';
import { resolveVideoDurationPolicy } from '../domain/image-generation.utils';
import {
  VideoGenerationAdapterPort,
  VideoGenerationOptions,
  VideoGenerationResult,
} from './video-generation.adapter.port';

interface VideoJobResponse {
  id?: string;
  polling_url?: string;
  status?: string;
  unsigned_urls?: string[];
  error?: string;
}

const DEFAULT_MODEL = 'bytedance/seedance-2.0-fast';
const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_ATTEMPTS = 40;

@Injectable()
export class OpenRouterVideoGenerationAdapter implements VideoGenerationAdapterPort {
  private readonly logger = new Logger(OpenRouterVideoGenerationAdapter.name);

  constructor(private readonly llmConfig: LlmConfigService) {}

  async generateVideo(
    prompt: string,
    options?: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    const resolved = await this.llmConfig.resolve('video_generation');
    const model = resolved.model?.trim() || DEFAULT_MODEL;
    const durationPolicy = resolveVideoDurationPolicy(model);
    const duration = clampDuration(options?.duration ?? durationPolicy.defaultDuration, durationPolicy);
    const aspectRatio = options?.aspectRatio ?? '9:16';
    const resolution = options?.resolution ?? '720p';

    const styledPrompt = options?.style?.trim()
      ? `Style: ${options.style}. ${prompt}`
      : prompt;

    const baseUrl = resolved.apiUrl.replace(/\/$/, '');
    const submitUrl = baseUrl.includes('/api/v1')
      ? `${baseUrl}/videos`
      : `${baseUrl}/api/v1/videos`;

    const body: Record<string, unknown> = {
      model,
      prompt: styledPrompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution,
      generate_audio: !!options?.generateAudio, // Explicit false to disable default audio generation
    };

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
      const err = await submitResponse.text();
      throw new Error(`Video generation failed (${submitResponse.status}): ${err}`);
    }

    const job = (await submitResponse.json()) as VideoJobResponse;
    const completed = await this.waitForCompletion(job, resolved.apiKey);
    return this.downloadVideo(completed, resolved.apiKey);
  }

  private async waitForCompletion(
    job: VideoJobResponse,
    apiKey: string,
  ): Promise<VideoJobResponse> {
    let current = job;

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
      if (current.status === 'completed') {
        return current;
      }

      if (current.status === 'failed') {
        throw new Error(current.error ?? 'Video generation failed');
      }

      if (current.status && ['cancelled', 'expired'].includes(current.status)) {
        throw new Error(current.error ?? `Video generation ${current.status}`);
      }

      if (attempt === MAX_POLL_ATTEMPTS) {
        break;
      }

      await sleep(POLL_INTERVAL_MS);

      const pollingUrl = resolvePollingUrl(current);
      const pollResponse = await fetch(pollingUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollResponse.ok) {
        const err = await pollResponse.text();
        throw new Error(`Video poll failed (${pollResponse.status}): ${err}`);
      }

      current = (await pollResponse.json()) as VideoJobResponse;
      this.logger.debug(`Video job ${current.id ?? '?'} status: ${current.status ?? 'unknown'}`);
    }

    throw new Error('Video generation timed out');
  }

  private async downloadVideo(
    job: VideoJobResponse,
    apiKey: string,
  ): Promise<VideoGenerationResult> {
    const videoUrl =
      job.unsigned_urls?.[0] ??
      (job.id ? `https://openrouter.ai/api/v1/videos/${job.id}/content?index=0` : null);

    if (!videoUrl) {
      throw new Error('Video generation returned no download URL');
    }

    const needsAuth = videoUrl.includes('openrouter.ai/api/');
    const response = await fetch(videoUrl, {
      headers: needsAuth ? { Authorization: `Bearer ${apiKey}` } : undefined,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to download generated video (${response.status}): ${err}`);
    }

    return {
      videoBuffer: Buffer.from(await response.arrayBuffer()),
      mimeType: response.headers.get('content-type') ?? 'video/mp4',
    };
  }
}

function resolvePollingUrl(job: VideoJobResponse): string {
  if (job.polling_url) {
    return job.polling_url.startsWith('http')
      ? job.polling_url
      : `https://openrouter.ai${job.polling_url.startsWith('/') ? '' : '/'}${job.polling_url}`;
  }

  if (job.id) {
    return `https://openrouter.ai/api/v1/videos/${job.id}`;
  }

  throw new Error('Video job did not include polling_url or id');
}

function clampDuration(
  seconds: number,
  policy = resolveVideoDurationPolicy(),
): number {
  if (!Number.isFinite(seconds)) {
    return policy.defaultDuration;
  }

  return Math.min(policy.maxDuration, Math.max(policy.minDuration, Math.round(seconds)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
