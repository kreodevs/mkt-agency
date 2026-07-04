import { Injectable } from '@nestjs/common';
import { LlmClient } from '../../../shared/ai/llm.client';
import {
  SocialCopyAdapterPort,
  SocialCopyBatch,
  SocialCopyContext,
} from './social-copy.adapter.port';
import { normalizeSocialCopyBatch } from './social-copy-normalizer.util';

const PLATFORM_GUIDES: Record<string, string> = {
  instagram: 'Instagram: contenido visual, tono aspiracional, stories + feed, máx 2200 caracteres',
  linkedin: 'LinkedIn: tono profesional, liderazgo de pensamiento, 150-300 palabras, 3-5 hashtags',
  twitter: 'X/Twitter: conciso, máx 280 caracteres, 1-2 hashtags, tono conversacional',
  facebook: 'Facebook: tono cercano, 80-150 palabras, incluir llamado a la acción claro',
  tiktok: 'TikTok: contenido breve y entretenido, copy para video de 15-60 segundos, tono juvenil',
};

@Injectable()
export class OpenRouterSocialCopyAdapter implements SocialCopyAdapterPort {
  constructor(private readonly llm: LlmClient) {}

  async generate(context: SocialCopyContext): Promise<SocialCopyBatch> {
    const platformGuides = context.platforms
      .map((p) => PLATFORM_GUIDES[p] ?? `Plataforma: ${p}`)
      .join('\n');

    const toneGuide = context.tone
      ? `Tono: ${context.tone}`
      : 'Tono: profesional pero cercano, en español neutro (tuteo mexicano)';

    const topicsGuide = context.topics?.length
      ? `Temas a cubrir: ${context.topics.join(', ')}`
      : 'Temas: contenido orgánico variado relevante para la industria del cliente';

    const brandContext = context.brandBrief
      ? `Contexto de marca y producto: ${JSON.stringify(context.brandBrief)}`
      : '';

    const productFocus = context.focusProductName
      ? `IMPORTANTE: Todo el copy debe promocionar exclusivamente el producto/servicio "${context.focusProductName}". No mezcles otros productos del catálogo.`
      : '';

    const systemPrompt =
      'Eres un Community Manager senior experto en marketing digital. ' +
      'Genera copy para redes sociales que conecte con la audiencia y genere engagement. ' +
      'Si hay un producto en foco, todos los posts deben vender o dar valor sobre ESE producto únicamente. ' +
      'Responde SOLO con JSON válido con esta estructura exacta:\n' +
      JSON.stringify({
        summary: 'resumen de la tanda de publicaciones generadas',
        posts: [
          {
            id: 'post-1',
            platform: 'instagram | linkedin | twitter | facebook | tiktok',
            title: 'título o idea principal del post',
            body: 'texto completo del post con saltos de línea y emojis apropiados',
            hashtags: ['hashtag1', 'hashtag2'],
            visualDescription: 'descripción de la imagen/video que acompañaría este post',
            visualFormat:
              'image | video | carousel — image=post estático, video=clip con narración (TikTok/Reels), carousel=3 slides',
            bestTime: 'mejor hora para publicar según la plataforma',
            targetAudience: 'audiencia objetivo de este post específico',
            callToAction: 'llamado a la acción claro',
            tone: 'tono usado en este post',
          },
        ],
        publishingGuide:
          'guía de publicación en lenguaje de negocio explicando la estrategia detrás de los posts',
        generatedAt: 'ISO8601',
      });

    const userPrompt = [
      `Plataformas objetivo: ${context.platforms.join(', ')}`,
      `Cantidad de posts: ${context.count}`,
      platformGuides,
      toneGuide,
      topicsGuide,
      brandContext,
      productFocus,
      `Instrucción: Genera ${context.count} posts de alta calidad para redes sociales siguiendo las guías de cada plataforma.`,
      'Para cada post asigna visualFormat: tiktok→video preferente; carruseles educativos→carousel; linkedin/twitter/facebook feed→image salvo que el post pida reel/video explícitamente.',
      'visualDescription debe describir la escena visual acorde a visualFormat (no repitas el body del post).',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = await this.llm.chatJson<Record<string, unknown>>(
      systemPrompt,
      userPrompt,
      { taskType: 'social_copy', maxTokens: 8192 },
    );

    const normalized = normalizeSocialCopyBatch(result, {
      count: context.count,
      platforms: context.platforms,
    });

    if (!normalized.posts.length) {
      throw new Error('Invalid social copy response from LLM');
    }

    return {
      summary: normalized.summary,
      posts: normalized.posts,
      publishingGuide: normalized.publishingGuide,
      generatedAt: normalized.generatedAt ?? new Date().toISOString(),
    };
  }
}