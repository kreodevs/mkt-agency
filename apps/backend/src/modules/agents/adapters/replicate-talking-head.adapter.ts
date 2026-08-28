import { Injectable, Logger } from '@nestjs/common';
import { LlmConfigService } from '../../../shared/ai/llm-config.service';
import {
  TalkingHeadAdapterPort,
  TalkingHeadInput,
  TalkingHeadResult,
} from './talking-head.adapter.port';

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 120;

@Injectable()
export class ReplicateTalkingHeadAdapter implements TalkingHeadAdapterPort {
  private readonly logger = new Logger(ReplicateTalkingHeadAdapter.name);

  constructor(private readonly llmConfig: LlmConfigService) {}

  async generate(input: TalkingHeadInput): Promise<TalkingHeadResult> {
    const resolved = await this.llmConfig.resolve('talking_head_generation');
    const model = resolved.model?.trim() || 'prunaai/p-video-avatar';
    const baseUrl = resolved.apiUrl.replace(/\/$/, '');

    const createResponse = await fetch(`${baseUrl}/models/${model}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resolved.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          image: input.imageUrl,
          audio: input.audioUrl,
          resolution: input.resolution ?? '720p',
          video_prompt:
            input.videoPrompt ??
            'Plano medio estable, la persona habla a cámara con naturalidad, hombros visibles, fondo suave.',
        },
      }),
    });

    if (!createResponse.ok) {
      const err = await createResponse.text();
      throw new Error(`Replicate talking-head failed (${createResponse.status}): ${err}`);
    }

    const created = (await createResponse.json()) as {
      id?: string;
      status?: string;
      output?: string | string[] | null;
      error?: string | null;
    };

    const predictionId = created.id;
    if (!predictionId) {
      throw new Error('Replicate returned no prediction id');
    }

    let status = created.status ?? 'starting';
    let output = created.output ?? null;
    let attempts = 0;

    while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('Replicate talking-head timed out');
      }
      await this.sleep(POLL_INTERVAL_MS);
      attempts += 1;

      const pollResponse = await fetch(`${baseUrl}/predictions/${predictionId}`, {
        headers: { Authorization: `Bearer ${resolved.apiKey}` },
      });
      if (!pollResponse.ok) {
        const err = await pollResponse.text();
        throw new Error(`Replicate poll failed (${pollResponse.status}): ${err}`);
      }

      const polled = (await pollResponse.json()) as {
        status?: string;
        output?: string | string[] | null;
        error?: string | null;
      };
      status = polled.status ?? status;
      output = polled.output ?? output;
      if (polled.error) {
        throw new Error(polled.error);
      }
    }

    if (status !== 'succeeded') {
      throw new Error(`Replicate talking-head ended with status: ${status}`);
    }

    const videoUrl = Array.isArray(output) ? output[0] : output;
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Replicate talking-head returned no video URL');
    }

    this.logger.log(`Talking-head ready: ${predictionId}`);
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download talking-head video (${videoResponse.status})`);
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
    return {
      videoBuffer,
      mimeType: 'video/mp4',
      outputUrl: videoUrl,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

@Injectable()
export class StubTalkingHeadAdapter implements TalkingHeadAdapterPort {
  async generate(_input: TalkingHeadInput): Promise<TalkingHeadResult> {
    throw new Error(
      'Avatar hablante no configurado. Añade API key de Replicate en Superadmin → Proveedores LLM.',
    );
  }
}
