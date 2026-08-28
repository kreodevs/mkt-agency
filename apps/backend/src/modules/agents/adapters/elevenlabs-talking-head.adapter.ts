import { Injectable, Logger } from '@nestjs/common';
import { LlmProviderService } from '../../../shared/ai/llm-provider.service';
import {
  TalkingHeadAdapterPort,
  TalkingHeadInput,
  TalkingHeadResult,
} from './talking-head.adapter.port';

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const AUDIO_MIME_TYPES = new Set(['audio/mpeg', 'audio/wav']);

type ElevenLabsPollPayload = {
  status?: string;
  content_url?: string;
  contentUrl?: string;
  content_mime_type?: string;
  contentMimeType?: string;
  error_message?: string;
  errorMessage?: string;
};

@Injectable()
export class ElevenLabsTalkingHeadAdapter implements TalkingHeadAdapterPort {
  private readonly logger = new Logger(ElevenLabsTalkingHeadAdapter.name);

  constructor(private readonly llmProviders: LlmProviderService) {}

  async generate(input: TalkingHeadInput): Promise<TalkingHeadResult> {
    const provider = await this.llmProviders.findEntityBySlug('elevenlabs');
    if (!provider?.apiKey?.trim()) {
      throw new Error('ElevenLabs no configurado. Añade API key en Superadmin → Proveedores LLM.');
    }

    const baseUrl = provider.apiUrl.replace(/\/$/, '');
    const apiKey = provider.apiKey.trim();

    const [imagePayload, audioPayload] = await Promise.all([
      this.loadInlineImage(input.imageUrl),
      this.loadInlineAudio(input.audioUrl),
    ]);

    const createResponse = await fetch(`${baseUrl}/flows/video`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: 'creatify-aurora',
        image: imagePayload,
        audio: audioPayload,
        resolution: input.resolution ?? '720p',
      }),
    });

    if (!createResponse.ok) {
      const err = await createResponse.text();
      throw new Error(this.sanitizeApiError(`ElevenLabs lip-sync failed (${createResponse.status})`, err));
    }

    const created = (await createResponse.json()) as { id?: string; status?: string };
    const generationId = created.id?.trim();
    if (!generationId) {
      throw new Error('ElevenLabs lip-sync returned no generation id');
    }

    let status = created.status ?? 'pending';
    let contentUrl: string | null = null;
    let contentMimeType = 'video/mp4';
    let attempts = 0;

    while (status !== 'completed' && status !== 'failed') {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error('ElevenLabs lip-sync timed out');
      }
      await this.sleep(POLL_INTERVAL_MS);
      attempts += 1;

      const pollResponse = await fetch(`${baseUrl}/flows/video/${generationId}`, {
        headers: {
          'xi-api-key': apiKey,
          Accept: 'application/json',
        },
      });
      if (!pollResponse.ok) {
        const err = await pollResponse.text();
        throw new Error(
          this.sanitizeApiError(`ElevenLabs lip-sync poll failed (${pollResponse.status})`, err),
        );
      }

      const polled = (await pollResponse.json()) as ElevenLabsPollPayload;
      status = polled.status ?? status;
      contentUrl = polled.content_url ?? polled.contentUrl ?? contentUrl;
      contentMimeType = polled.content_mime_type ?? polled.contentMimeType ?? contentMimeType;

      if (status === 'failed') {
        const errorMessage = polled.error_message ?? polled.errorMessage;
        throw new Error(errorMessage?.trim() || 'ElevenLabs lip-sync failed');
      }
    }

    if (!contentUrl) {
      throw new Error('ElevenLabs lip-sync returned no video URL');
    }

    this.logger.log(`ElevenLabs talking-head ready: ${generationId}`);
    const videoBuffer = await this.downloadVideo(contentUrl);
    return {
      videoBuffer,
      mimeType: contentMimeType || 'video/mp4',
      outputUrl: contentUrl,
    };
  }

  private async downloadVideo(contentUrl: string): Promise<Buffer> {
    if (contentUrl.startsWith('data:')) {
      const match = /^data:([^;]+);base64,(.+)$/i.exec(contentUrl);
      if (!match?.[2]) {
        throw new Error('ElevenLabs devolvió un data URL de video inválido');
      }
      return Buffer.from(match[2], 'base64');
    }

    const videoResponse = await fetch(contentUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download ElevenLabs video (${videoResponse.status})`);
    }

    return Buffer.from(await videoResponse.arrayBuffer());
  }

  private async loadInlineImage(
    url: string,
  ): Promise<{ type: 'inline_base64'; content_base64: string; mime_type: string }> {
    const { buffer, mimeType } = await this.fetchMedia(url);
    const normalized = this.normalizeImageMime(mimeType);
    if (!IMAGE_MIME_TYPES.has(normalized)) {
      throw new Error(`Formato de imagen no soportado por ElevenLabs: ${normalized}`);
    }
    return {
      type: 'inline_base64',
      content_base64: buffer.toString('base64'),
      mime_type: normalized,
    };
  }

  private async loadInlineAudio(
    url: string,
  ): Promise<{ type: 'inline_base64'; content_base64: string; mime_type: string }> {
    const { buffer, mimeType } = await this.fetchMedia(url);
    const normalized = this.normalizeAudioMime(mimeType);
    if (!AUDIO_MIME_TYPES.has(normalized)) {
      throw new Error(`Formato de audio no soportado por ElevenLabs: ${normalized}`);
    }
    return {
      type: 'inline_base64',
      content_base64: buffer.toString('base64'),
      mime_type: normalized,
    };
  }

  private async fetchMedia(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo descargar el archivo para lip-sync (${response.status})`);
    }
    const mimeType =
      response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, mimeType };
  }

  private normalizeImageMime(mimeType: string): string {
    const base = mimeType.split(';')[0]?.trim().toLowerCase() || 'image/jpeg';
    if (base === 'image/jpg') {
      return 'image/jpeg';
    }
    return base;
  }

  private normalizeAudioMime(mimeType: string): string {
    const base = mimeType.split(';')[0]?.trim().toLowerCase() || 'audio/mpeg';
    if (base === 'audio/mp3') {
      return 'audio/mpeg';
    }
    return base;
  }

  private sanitizeApiError(prefix: string, raw: string): string {
    const compact = raw.replace(/\s+/g, ' ').trim();
    const withoutBase64 = compact.replace(/[A-Za-z0-9+/]{120,}={0,2}/g, '[base64 omitido]');
    const message = withoutBase64 || 'respuesta vacía';
    return `${prefix}: ${message.slice(0, 400)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
