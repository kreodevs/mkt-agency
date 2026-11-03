import type { SocialCopyContext } from './social-copy.adapter.port';
import { feedbackRequestsMediaKit } from '../domain/feedback-visual-intent.util';
import { styleDesignCue } from '../domain/visual-palette-expand.util';
import { styleLabel } from '../domain/visual-brand-kit.util';
import { sampleViralHooksForPrompt } from './social-copy-hooks.constants';

const PLATFORM_GUIDES: Record<string, string> = {
  instagram: 'Instagram: contenido visual, tono aspiracional, stories + feed, máx 2200 caracteres',
  linkedin: 'LinkedIn: tono profesional, liderazgo de pensamiento, 150-300 palabras, 3-5 hashtags',
  twitter: 'X/Twitter: gancho demoledor en línea 1 (sin saludos ni frases de relleno), problema o cifra alarmante en 1-2 bullets concisos, solución y CTA de alto impacto al final. Máx 280 caracteres, 1-2 hashtags de nicho. Prohibido tono institucional blando o fórmulas trilladas.',
  facebook: 'Facebook: tono cercano, 80-150 palabras, incluir llamado a la acción claro',
  tiktok: 'TikTok: contenido breve y entretenido, copy para video de 15-60 segundos, tono juvenil',
};

export interface BuiltPrompts {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export function buildPrompts(context: SocialCopyContext): BuiltPrompts {
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

  const knowledgeGuide = context.knowledgeContext?.trim() ? context.knowledgeContext.trim() : '';

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
        'Para software, SaaS, apps o herramientas digitales con kit de medios: OBLIGATORIO visualTemplateId=product-hero o promo-cta con dispositivo mockup (MacBook/iPad/iPhone) mostrando la UI real. Los compradores de software necesitan VER el software funcionando, no una foto de stock de alguien sonriendo.',
        'Usa visualTemplateId=creative-scene únicamente para servicios físicos/presenciales o momentos lifestyle donde la UI no sea relevante.',
      ].join('\n')
    : '';

  const libraryFoldersGuide = context.libraryFolders?.length
    ? [
        `Librería multimedia organizada en carpetas (${context.libraryFolders.length} carpetas con archivos): ${JSON.stringify(context.libraryFolders)}`,
        'Las carpetas agrupan capturas por dispositivo (PC, iPad, iOS). Si el kit de medios está vacío o incompleto, menciona en visualDescription qué tipo de captura encaja (ej. app móvil → carpeta iOS).',
        'Sugiere al usuario enlazar assets desde estas carpetas al kit de medios del producto para posts con capturas reales.',
      ].join('\n')
    : '';

  const brandVisualStyle = typeof context.brandBrief?.brandVisualStyle === 'string'
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

  const sampledHooks = sampleViralHooksForPrompt(6);
  const viralHooksGuide = [
    'REGLAS DE COPYWRITING VIRAL & CONVERSIÓN (Detención de pulgar en 3 segundos):',
    '1. NUNCA inicies con saludos pasivos ni fórmulas aburridas ("¡Hola a todos!", "Hoy queremos hablar de...", "En el mundo actual...").',
    '2. LÍNEA 1 = SCROLL-STOPPER OBLIGATORIO: El primer renglón del body debe ser un gancho contundente que despierte curiosidad, agite un dolor o derribe un mito.',
    '3. INSPIRACIÓN DE GANCHOS VIRALES PROBADOS (adopta o adapta uno para el primer renglón):',
    ...sampledHooks,
    '4. MARCOS PSICOLÓGICOS (estructura cada post según su persuasionFramework):',
    '   - PAS (Problema → Agitación → Solución): Expón el dolor -> Muestra el costo de no resolverlo -> Presenta el producto/servicio como la solución definitiva -> CTA.',
    '   - BAB (Antes → Después → Puente): Describe el estado frustrante previo -> Pinta el escenario ideal deseado -> Posiciona tu producto como el puente directo -> CTA.',
    '   - SocialProof (Prueba Social & Casos): Cuenta una historia real o resultado tangible -> Derriba la duda -> Valida con cifras o beneficios -> CTA.',
    '   - Contrarian (Verdad Contraria / Anti-Mito): Cuestiona un mito popular -> Explica por qué falla la forma tradicional -> Demuestra la nueva alternativa -> CTA.',
    '   - FOMO / DirectOffer: Razón clara para actuar ahora (ventaja temporal o beneficio directo) -> Valor garantizado -> CTA contundente.',
    '5. OPTIMIZACIÓN ALGORÍTMICA 2026 (SEO Semántico):',
    '   - Los algoritmos de Instagram, TikTok y LinkedIn indexan las primeras 2 líneas como motor de búsqueda semántica: incluye términos de búsqueda naturales de tu cliente.',
    '   - MÁXIMO 1 a 3 hashtags hiper-específicos al final (prohibido hashtag stuffing como #viral, #fyp, #trending).',
    '6. FÓRMULAS TRILLEDAS PROHIBIDAS (EXPULSIÓN DE CLICHÉS CORPORATIVOS):',
    '   - NUNCA uses "Con [Producto], olvídate de..." ni "al alcance de un clic" ni "la herramienta que necesitas" ni "en el mundo actual / en el vertiginoso mundo".',
    '   - NUNCA uses eslóganes pasivos o descriptivos como "Tu consultorio más organizado" o "Gestiona tu negocio".',
    '   - El titular visual (visualHeadline) debe generar tensión, urgencia o curiosidad: "¿Cuánto dinero te cuesta cada cita no confirmada?", "De agendas en papel a 40 pacientes confirmados", "Lo que las clínicas más rentables nunca te contaron".',
  ].join('\n');

  const cmCharacterGuide = context.cmCharacterReady && context.cmCharacters?.length
    ? [
        `Biblioteca de CMs virtuales listas (${context.cmCharacters.length}): ${JSON.stringify(context.cmCharacters)}`,
        'OBLIGATORIO: incluye al menos 1 post con visualFormat talking-head (video con lip-sync de la CM).',
        'talking-head en TikTok o Instagram Reels: platform instagram/tiktok, visualTemplateId story-vertical, imageDestination story.',
        'Elige cmCharacterId según tono (formal → ejecutiva, cercano → juvenil).',
        'visualDescription en talking-head: solo fondo/ambiente del reel (consultorio, oficina moderna, luz natural). NO describas otra persona.',
        'REGLAS CRÍTICAS PARA EL BODY DE TALKING-HEAD (guion hablado para avatar):',
        '1. LONGITUD: Máximo 45 a 60 palabras (18 a 24 segundos). El avatar de video tiene un límite de duración estricto; textos más largos se cortan antes de terminar la frase final.',
        '2. ESTRICTAMENTE CERO EMOJIS: Prohibido incluir emojis en el body hablado (la voz sintética no los lee y provocan cortes de sincronización labial).',
        '3. CERO HASHTAGS: Prohibido incluir hashtags (#) en el body hablado. Los hashtags van únicamente en el campo hashtags.',
        '4. TONO: Natural, primera persona, conversacional, sin timestamps ni acotaciones de producción entre paréntesis.',
        'En posts estáticos/carousel el sistema superpone el retrato de la CM en la portada.',
        'En talking-head el sistema añade automáticamente capturas del media kit: intro de producto (~3 s) + PiP con la app durante el reel.',
      ].join('\n')
    : context.cmCharacterReady
      ? [
          'La marca tiene CM virtual lista (retrato + lip-sync en español).',
          'OBLIGATORIO: al menos 1 post talking-head en TikTok o Instagram Reels (story-vertical).',
          'visualDescription en talking-head: fondo/ambiente del reel, NO otra persona.',
          'REGLAS DEL BODY TALKING-HEAD: 45-60 palabras máximo (18-24 s), CERO emojis, CERO hashtags en el texto hablado, sin timestamps ni direcciones de escena.',
        ].join('\n')
      : 'No hay CM virtual lista: NO uses visualFormat talking-head. TikTok→image vertical.';

  const countInstruction = context.postsPerPlatform
    ? `Genera exactamente ${context.postsPerPlatform} posts para CADA plataforma (${context.platforms.join(', ')}), ${context.count} posts en total.`
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
    viralHooksGuide,
    `Instrucción: ${countInstruction}`,
    context.cmCharacterReady
      ? 'visualFormat: ≥1 talking-head (TikTok o Instagram Reels; body = guion hablado 45-60 palabras, CERO emojis, CERO hashtags, 18-24 s); carruseles educativos→carousel; resto→image.'
      : 'visualFormat: carruseles educativos→carousel; resto→image (TikTok incluido: imagen vertical).',
    'visualDescription = brief de arte (ambiente, luz, emoción).',
    'visualTemplateId: product-hero (mockup con UI real para SaaS/software/apps), promo-cta (oferta directa con mockup), stat-highlight (métrica impactante), tip-card (consejo accionable), quote-insight (autoridad), creative-scene (foto lifestyle/ambiente), ai-art (infografía/concepto IA).',
    revisionWantsMediaKit
      ? [
          'Carrusel con MEDIA KIT (3 slides): cada frame lleva una captura REAL distinta del kit.',
          'body = exactamente 3 líneas o bullets, una idea por slide.',
          'visualHeadline = solo el hook del slide 1 (máx 6 palabras). visualCta = slide 3.',
          'NO repitas el mismo titular en los 3 frames.',
          'visualDescription = cómo enmarcar la captura (ej. app iOS en iPhone).',
        ].join('\n')
      : 'Carrusel (3 slides): slide 1 = hook; slide 2 = feature; slide 3 = CTA.',
    'visualHeadline / visualSubline / visualCta = textos cortos DENTRO del diseño (sin hashtags).',
    'targetPainPoint = dolor humano o fricción comercial concreta que el post ataca directamente (ej: "Miedo a pagar de más por herramientas lentas").',
    'strategicAngle = ángulo de diferenciación competitiva frente al mercado o rivales (ej: "Configuración en 3 minutos sin código vs 48 horas de consultoría").',
    'persuasionFramework = marco de persuasión aplicado (PAS, BAB, SocialProof, Contrarian, FOMO o DirectOffer).',
    'visualIntent = intención visual estructurada (goal, subject, style, preferLayout, scene, carouselStructure).',
    'Para software, SaaS o plataformas digitales con capturas en el kit: prioriza visualTemplateId=product-hero o promo-cta.',
    'visualIntent.scene=clinical para salud; hand-phone para stories; workspace para SaaS; abstract-premium para marca.',
    'Si usas creative-scene, rellena visualIntent.scene según industria/plataforma.',
    'body = copy publicable listo, sin marcadores de tiempo ni direcciones de escena.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    systemPrompt: buildSystemPrompt(),
    userPrompt,
    temperature: context.revisionBrief?.trim() ? 0.45 : 0.6,
  };
}

function buildSystemPrompt(): string {
  return (
    'Eres un Director Creativo y Copywriter de Respuesta Directa de clase mundial, especializado en marketing viral y conversión en redes sociales (Instagram, LinkedIn, X, TikTok, Facebook). ' +
    'Generas copy de alta retención que detiene el scroll en los primeros 3 segundos, despierta interés genuino o dolor latente y convierte seguidores en clientes potenciales. ' +
    'NUNCA inicies con saludos pasivos ni fórmulas genéricas. Optimiza las primeras 2 líneas con términos de búsqueda semántica (SEO). ' +
    'Si hay un producto en foco, todos los posts deben posicionar y vender exclusivamente ESE producto con ángulos persuasivos y ganchos de alta conversión. ' +
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
          targetPainPoint: 'dolor concreto que ataca el post (ej: Frustración por procesos manuales lentos)',
          strategicAngle: 'ventaja diferencial vs competencia (ej: Automatización en 1 clic vs semanas de desarrollo)',
          persuasionFramework: 'PAS | BAB | SocialProof | Contrarian | FOMO | DirectOffer',
          visualDescription: 'escena visual para IA — SIN repetir el body ni hashtags',
          visualTemplateId: 'creative-scene | ai-art | product-hero | tip-card | quote-insight | promo-cta | stat-highlight | story-vertical',
          visualHeadline: 'titular corto para la pieza gráfica (3-8 palabras, sin hashtags)',
          visualSubline: 'subtítulo opcional (máx 14 palabras)',
          visualCta: 'CTA corto para botón visual (2-4 palabras)',
          visualFormat: 'image | carousel | talking-head',
          imageDestination: 'feed | story',
          bestTime: 'mejor hora para publicar',
          targetAudience: 'audiencia objetivo de este post',
          callToAction: 'llamado a la acción claro',
          tone: 'tono usado en este post',
          cmCharacterId: 'uuid de la CM virtual (solo talking-head)',
          visualIntent: {
            goal: 'objetivo visual (educar, vender, inspirar…)',
            subject: 'tema principal de la pieza gráfica',
            style: 'minimal | bold | luxury | editorial | playful | technical | photoreal | illustration | flatlay | infographic',
            preferLayout: 'template | ai-art | creative-scene | auto',
            scene: 'auto | workspace | hand-phone | clinical | abstract-premium',
            carouselStructure: 'hook-feature-cta | listicle | before-after | step-by-step | multi-stat',
          },
        },
      ],
      publishingGuide: 'guía de publicación explicando la estrategia',
      generatedAt: 'ISO8601',
    })
  );
}

export function buildToolAwarePrompt(userPrompt: string, toolResults: string): string {
  if (!toolResults) return userPrompt;
  return `${userPrompt}\n\nDATOS DEL SISTEMA (usa esta información para enriquecer tus decisiones visuales):\n${toolResults}`;
}

export function buildSystemPromptWithTools(systemPrompt: string, toolResults: string): string {
  if (!toolResults) return systemPrompt;
  return (
    systemPrompt +
    `\n\n---\nDATOS ENRIQUECIDOS DEL SISTEMA (usa esta información para contextualizar visualDescription, visualIntent, y la selección de estilo visual):\n${toolResults}`
  );
}
