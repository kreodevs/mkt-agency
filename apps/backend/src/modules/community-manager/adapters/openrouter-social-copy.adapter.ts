import { Injectable } from '@nestjs/common';
import { feedbackRequestsMediaKit } from '../domain/feedback-visual-intent.util';
import { styleDesignCue } from '../domain/visual-palette-expand.util';
import { styleLabel } from '../domain/visual-brand-kit.util';
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

    const knowledgeGuide = context.knowledgeContext?.trim()
      ? context.knowledgeContext.trim()
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

    const revisionWantsMediaKit =
      feedbackRequestsMediaKit(context.revisionBrief) || (context.mediaKit?.length ?? 0) > 0;

    const revisionGuide = context.revisionBrief?.trim()
      ? [
          'REVISIÓN DE POST EXISTENTE — el usuario pidió cambios. NO reutilices el copy anterior tal cual.',
          `Feedback del usuario: ${context.revisionBrief.trim()}`,
          context.previousPost
            ? `Post anterior (${context.previousPost.platform ?? 'red social'}):\nTítulo: ${context.previousPost.title}\nCuerpo: ${context.previousPost.body}`
            : '',
          'Genera una versión nueva que incorpore el feedback (tono, titular visual, CTA).',
          revisionWantsMediaKit
            ? 'NO inventes escenas, empaques, productos físicos ni logos ficticios. El sistema usará capturas/fotos REALES del media kit con plantillas. visualDescription = cómo se verá el asset real (ej. captura desktop en MacBook).'
            : 'Si el feedback critica la imagen y NO hay media kit, describe en visualDescription una escena acorde al nicho y al comentario.',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    const mediaKitGuide = context.mediaKit?.length
      ? [
          `Kit de medios del producto (${context.mediaKit.length} archivos reales): ${JSON.stringify(context.mediaKit)}`,
          'IMPORTANTE: El sistema COMBINARÁ fotos/videos reales del kit en el post. NO pidas dashboards genéricos ni stock corporativo si hay capturas o fotos de evento.',
          'Cada ítem puede incluir folderPath (carpeta en librería) y device (pc|ipad|ios). Usa device para elegir capturas acordes a la plataforma: TikTok/Instagram→ios/ipad; LinkedIn→pc.',
          'En visualDescription indica cómo se verá el asset real (ej. "screenshot de la app iOS en mockup móvil", "captura desktop en MacBook").',
          'Evita escenas con ejecutivos anónimos, tablets con gráficas de negocio genéricas, u oficinas stock.',
          'Carrusel: body con 3 bullets (una idea por slide); cada frame usará una captura distinta del kit en mockup grande tipo anuncio (no miniaturas).',
          'visualHeadline solo en slide 1; slide 2 = beneficio concreto del bullet 2; slide 3 = CTA corto (2-4 palabras).',
          'Posts estáticos (image) con kit: visualIntent.preferLayout=creative-scene y scene=clinical|workspace|hand-phone según industria. NO uses product-hero para lanzamientos con capturas reales.',
        ].join('\n')
      : '';

    const libraryFoldersGuide = context.libraryFolders?.length
      ? [
          `Librería multimedia organizada en carpetas (${context.libraryFolders.length} carpetas con archivos): ${JSON.stringify(context.libraryFolders)}`,
          'Las carpetas agrupan capturas por dispositivo (PC, iPad, iOS). Si el kit de medios está vacío o incompleto, menciona en visualDescription qué tipo de captura encaja (ej. app móvil → carpeta iOS).',
          'Sugiere al usuario enlazar assets desde estas carpetas al kit de medios del producto para posts con capturas reales.',
        ].join('\n')
      : '';

    const brandVisualStyle =
      typeof context.brandBrief?.brandVisualStyle === 'string'
        ? context.brandBrief.brandVisualStyle
        : typeof context.brandBrief?.style === 'string'
          ? context.brandBrief.style
          : 'minimal';

    const creativeDesignGuide = [
      'DIRECCIÓN CREATIVA (obligatoria): piensa como diseñador de performance ads, no como wireframe.',
      `Estilo visual de marca: ${styleLabel(brandVisualStyle as 'minimal' | 'bold' | 'luxury')} — ${styleDesignCue(brandVisualStyle as 'minimal' | 'bold' | 'luxury')}.`,
      'El sistema expande la paleta (degradados, brillos, acentos) a partir de los colores de marca; evita pedir solo bloques planos.',
      'visualHeadline = gancho emocional (beneficio o dolor), no descripción técnica.',
      'visualSubline = prueba o contexto concreto (1 frase).',
      'visualCta = acción de conversión (demo, prueba gratis, descarga).',
      'Varía el ángulo entre posts: dolor→solución, dato→beneficio, objeción→prueba, CTA directo.',
    ].join('\n');

    const cmCharacterGuide =
      context.cmCharacterReady && context.cmCharacters?.length
        ? [
            `Biblioteca de CMs virtuales listas (${context.cmCharacters.length}): ${JSON.stringify(context.cmCharacters)}`,
            'OBLIGATORIO: incluye al menos 1 post con visualFormat talking-head (video con lip-sync de la CM).',
            'talking-head en TikTok o Instagram Reels: platform instagram/tiktok, visualTemplateId story-vertical, imageDestination story.',
            'Elige cmCharacterId según tono (formal → ejecutiva, cercano → juvenil).',
            'visualDescription en talking-head: solo fondo/ambiente del reel (consultorio, oficina moderna, luz natural). NO describas otra persona.',
            'El body del talking-head = guion hablado 15-45 s, natural, sin timestamps ni direcciones de escena.',
            'En posts estáticos/carousel el sistema superpone el retrato de la CM en la portada.',
            'En talking-head el sistema añade automáticamente capturas del media kit: intro de producto (~3 s) + PiP con la app durante el reel.',
          ].join('\n')
        : context.cmCharacterReady
          ? [
              'La marca tiene CM virtual lista (retrato + lip-sync en español).',
              'OBLIGATORIO: al menos 1 post talking-head en TikTok o Instagram Reels (story-vertical).',
              'visualDescription en talking-head: fondo/ambiente del reel, NO otra persona.',
              'Guion hablado 15-45 s, sin timestamps ni direcciones de escena.',
            ].join('\n')
          : 'No hay CM virtual lista: NO uses visualFormat talking-head. TikTok→image vertical.';

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
            visualDescription: 'escena visual para IA (fondo/ambiente si aplica) — SIN repetir el body ni hashtags',
            visualTemplateId:
              'product-hero | tip-card | quote-insight | promo-cta | stat-highlight | story-vertical',
            visualHeadline: 'titular corto para la pieza gráfica (3-8 palabras, sin hashtags)',
            visualSubline: 'subtítulo opcional para la plantilla (máx 14 palabras)',
            visualCta: 'CTA corto para botón visual (2-4 palabras)',
            visualFormat:
              'image | carousel | talking-head — talking-head=video CM virtual (TikTok o IG Reels); image=estático; carousel=3 slides',
            imageDestination: 'feed | story — story para Reels/TikTok talking-head',
            bestTime: 'mejor hora para publicar según la plataforma',
            targetAudience: 'audiencia objetivo de este post específico',
            callToAction: 'llamado a la acción claro',
            tone: 'tono usado en este post',
            cmCharacterId:
              'uuid de la CM virtual (solo si visualFormat=talking-head y hay biblioteca)',
            visualIntent: {
              goal: 'objetivo visual del post (educar, vender, inspirar…)',
              subject: 'tema o sujeto principal de la pieza gráfica',
              style:
                'minimal | bold | luxury | editorial | playful | technical | photoreal | illustration | flatlay | infographic',
              preferLayout:
                'template | ai-art | creative-scene | auto — creative-scene para CM en escena real con app; template si plantilla rígida; ai-art para arte abstracto',
              scene:
                'auto | workspace | hand-phone | clinical | abstract-premium — arquetipo de escena creativa (CM en oficina, mano con móvil, clínica, marca abstracta)',
              carouselStructure:
                'hook-feature-cta | listicle | before-after | step-by-step | multi-stat (solo carousel)',
            },
          },
        ],
        publishingGuide:
          'guía de publicación en lenguaje de negocio explicando la estrategia detrás de los posts',
        generatedAt: 'ISO8601',
      });

    const countInstruction = context.postsPerPlatform
      ? `Genera exactamente ${context.postsPerPlatform} posts para CADA plataforma (${context.platforms.join(', ')}), ${context.count} posts en total. Cada plataforma debe aparecer ${context.postsPerPlatform} veces en el array posts con contenido distinto.`
      : `Genera ${context.count} posts de alta calidad para redes sociales siguiendo las guías de cada plataforma.`;

    const userPrompt = [
      `Plataformas objetivo: ${context.platforms.join(', ')}`,
      context.postsPerPlatform
        ? `Cantidad: ${context.postsPerPlatform} posts por plataforma (${context.count} en total)`
        : `Cantidad de posts: ${context.count}`,
      platformGuides,
      toneGuide,
      topicsGuide,
      brandContext,
      knowledgeGuide,
      productFocus,
      competitorIntelGuide,
      revisionGuide,
      mediaKitGuide,
      libraryFoldersGuide,
      cmCharacterGuide,
      creativeDesignGuide,
      `Instrucción: ${countInstruction}`,
      context.cmCharacterReady
        ? 'visualFormat: ≥1 talking-head (TikTok o Instagram Reels); carruseles educativos→carousel; resto→image. Prioriza variedad visual.'
        : 'visualFormat: carruseles educativos→carousel; resto→image (TikTok incluido: imagen vertical).',
      'visualDescription = brief de arte (ambiente, luz, emoción). Con media kit el sistema genera escena fotorealista CM + app real en pantalla.',
      'visualTemplateId = fallback si no hay kit; con kit usa creative-scene (no product-hero). Plantillas rígidas: tip-card, quote-insight, stat-highlight, promo-cta; story-vertical solo Reels/TikTok.',
      revisionWantsMediaKit
        ? [
            'Carrusel con MEDIA KIT (3 slides): cada frame lleva una captura REAL distinta del kit (mockup móvil/desktop).',
            'body = exactamente 3 líneas o bullets (Paso 1 / Paso 2 / Paso 3), una idea por slide.',
            'visualHeadline = solo el hook del slide 1 (máx 6 palabras). visualCta = titular del slide 3 (CTA).',
            'NO repitas el mismo titular en los 3 frames; el slide 2 usa el bullet del body como tip.',
            'visualDescription = cómo enmarcar la captura (ej. app iOS en iPhone), sin inventar UI ni logos.',
          ].join('\n')
        : 'Carrusel (3 slides): slide 1 = hook; slide 2 = feature; slide 3 = CTA. body con 3 bullets distintos.',
      'visualHeadline / visualSubline / visualCta = textos cortos que irán DENTRO del diseño (legibles, sin hashtags).',
      'visualIntent = intención visual estructurada para seleccionar receta de arte IA (goal, subject, style, preferLayout, scene, carouselStructure).',
      'preferLayout=creative-scene para posts premium con CM en escena real y captura del app en pantalla (stories, Reels estáticos, lanzamientos).',
      'scene=clinical para dental/salud; scene=hand-phone para stories/TikTok; scene=workspace para SaaS; scene=abstract-premium para marca sin dispositivo.',
      'preferLayout=template solo si necesitas tip-card/stat-highlight rígido; preferLayout=ai-art para infografías o posters sin capturas reales.',
      'body = copy publicable listo para publicar en la red, sin marcadores de tiempo (ej. "(0:00-0:05)") ni direcciones de escena. Son campos independientes.',
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