import { Injectable } from '@nestjs/common';
import { LlmConfigService } from '../../../shared/ai/llm-config.service';
import {
  DEFAULT_CM_VOICE_ID,
  DEFAULT_KOKORO_SPANISH_VOICE,
} from '../../community-manager/domain/cm-character.constants';
import {
  ElevenLabsVoiceOption,
  TtsGenerationAdapterPort,
  TtsGenerationInput,
  TtsGenerationResult,
} from './tts-generation.adapter.port';

@Injectable()
export class ElevenLabsTtsAdapter implements TtsGenerationAdapterPort {
  constructor(private readonly llmConfig: LlmConfigService) {}

  async listVoices(): Promise<ElevenLabsVoiceOption[]> {
    const resolved = await this.llmConfig.resolve('tts_generation');
    const baseUrl = resolved.apiUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/voices`, {
      headers: {
        'xi-api-key': resolved.apiKey,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs voices failed (${response.status}): ${err}`);
    }

    const payload = (await response.json()) as {
      voices?: Array<{
        voice_id?: string;
        name?: string;
        category?: string;
        labels?: Record<string, string>;
        preview_url?: string;
      }>;
    };

    const voices: ElevenLabsVoiceOption[] = [];

    for (const voice of payload.voices ?? []) {
      const id = voice.voice_id?.trim();
      const name = voice.name?.trim();
      if (!id || !name) {
        continue;
      }

      voices.push({
        id,
        name,
        category: voice.category,
        gender: voice.labels?.gender ?? null,
        accent: voice.labels?.accent ?? null,
        previewUrl: voice.preview_url ?? null,
      });
    }

    return voices.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  async synthesize(input: TtsGenerationInput): Promise<TtsGenerationResult> {
    const resolved = await this.llmConfig.resolve('tts_generation');
    const voiceId = input.voiceId?.trim() || DEFAULT_CM_VOICE_ID;
    const model = resolved.model?.trim() || 'eleven_multilingual_v2';
    const baseUrl = resolved.apiUrl.replace(/\/$/, '');
    const url = `${baseUrl}/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': resolved.apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: input.text,
        model_id: model,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs TTS failed (${response.status}): ${err}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
      provider: 'elevenlabs',
      model,
    };
  }
}

@Injectable()
export class OpenRouterTtsAdapter implements TtsGenerationAdapterPort {
  constructor(private readonly llmConfig: LlmConfigService) {}

  async synthesize(input: TtsGenerationInput): Promise<TtsGenerationResult> {
    const row = await this.llmConfig.listAll();
    const ttsTask = row.find((task) => task.taskType === 'tts_generation');
    const fallbackModel = ttsTask?.fallbackModel?.trim() || 'hexgrad/kokoro-82m';
    const openrouter = await this.llmConfig.resolve('image_generation');
    const baseUrl = openrouter.apiUrl.replace(/\/$/, '');
    const url = baseUrl.includes('/api/v1')
      ? `${baseUrl}/audio/speech`
      : `${baseUrl}/api/v1/audio/speech`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouter.apiKey}`,
      },
      body: JSON.stringify({
        model: fallbackModel,
        input: input.text,
        voice: DEFAULT_KOKORO_SPANISH_VOICE,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter TTS failed (${response.status}): ${err}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBuffer,
      mimeType: 'audio/mpeg',
      provider: 'openrouter',
      model: fallbackModel,
    };
  }
}

@Injectable()
export class StubTtsAdapter implements TtsGenerationAdapterPort {
  async synthesize(_input: TtsGenerationInput): Promise<TtsGenerationResult> {
    throw new Error('TTS no configurado. Añade API key de ElevenLabs en Superadmin → Proveedores LLM.');
  }
}
