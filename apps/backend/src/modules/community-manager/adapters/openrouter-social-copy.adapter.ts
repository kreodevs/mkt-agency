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

    const competitorIntelGuide = context.competitorIntelBrief
      ? [
          `Inteligencia competitiva (último análisis): ${JSON.stringify(context.competitorIntelBrief)}`,
          'Usa competitorIntel para diferenciar el producto: explota marketGaps y recommendation como ángulos de contenido.',
          'No copies el tono ni mensajes de competidores; evita reforzar sus fortalezas.',
          'Menciona ventajas propias frente a debilidades rivales cuando aporte valor, sin naming-shaming agresivo.',
        ].join('\n')
      : '';

    const revisionGuide = context.revisionBrief?.trim()
      ? [
          'REVISIÓN DE POST EXISTENTE — el usuario pidió cambios. NO reutilices el copy anterior tal cual.',
          `Feedback del usuario: ${context.revisionBrief.trim()}`,
          context.previousPost
            ? `Post anterior (${context.previousPost.platform ?? 'red social'}):\nTítulo: ${context.previousPost.title}\nCuerpo: ${context.previousPost.body}`
            : '',
          'Genera una versión nueva que incorpore el feedback (tono, nicho, tipo de visual en visualDescription).',
          'Si el feedback critica la imagen, describe en visualDescription una escena acorde al nicho y al comentario.',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const mediaKitGuide = context.mediaKit?.length
      ? [
          `Kit de medios del producto (${context.mediaKit.length} archivos reales): ${JSON.stringify(context.mediaKit)}`,
          'IMPORTANTE: El sistema COMBINARÁ fotos/videos reales del kit en el post. NO pidas dashboards genéricos ni stock corporativo si hay capturas o fotos de evento.',
          'En visualDescription indica cómo se verá el asset real (ej. "screenshot de la app en mockup móvil", "foto del taller con copy superpuesto").',
          'Evita escenas con ejecutivos anónimos, tablets con gráficas de negocio genéricas, u oficinas stock.',
        ].join('\n')
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
            visualDescription: 'escena visual para IA: composición, sujetos, ambiente y estilo — SIN repetir el body ni hashtags',
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
      competitorIntelGuide,
      revisionGuide,
      mediaKitGuide,
      `Instrucción: Genera ${context.count} posts de alta calidad para redes sociales siguiendo las guías de cada plataforma.`,
      'Para cada post asigna visualFormat: tiktok→video preferente; carruseles educativos→carousel; linkedin/twitter/facebook feed→image salvo que el post pida reel/video explícitamente.',
      'visualDescription = brief de arte para generador de imágenes (escena, luz, encuadre, estilo). NUNCA copies el body, hashtags ni CTA.',
      'body = copy publicable listo para publicar en la red. Son campos independientes.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const temperature = context.revisionBrief?.trim() ? 0.45 : 0.6;

    const result = await this.llm.chatJson<Record<string, unknown>>(
      systemPrompt,
      userPrompt,
      { taskType: 'social_copy', maxTokens: 8192, temperature },
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