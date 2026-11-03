/**
 * 50 fórmulas probadas de ganchos virales (Scroll-Stoppers & Pattern Interrupts)
 * para detener el pulgar en los primeros 3 segundos en Instagram, TikTok y LinkedIn.
 */

export interface ViralHookFormula {
  category: 'pattern_interrupt' | 'contrarian' | 'negative_warning' | 'insider_secret' | 'transformation' | 'direct_callout' | 'curiosity_gap';
  pattern: string;
  recommendedFramework: 'PAS' | 'BAB' | 'SocialProof' | 'Contrarian' | 'FOMO' | 'DirectOffer';
}

export const VIRAL_HOOK_FORMULAS: ViralHookFormula[] = [
  // 1. Pattern Interrupts (Rompen el patrón mental del feed)
  {
    category: 'pattern_interrupt',
    pattern: 'Deja de hacer {{painAction}} si quieres {{desiredGoal}}.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'pattern_interrupt',
    pattern: 'Esto no es para todos, pero si buscas {{desiredGoal}}, quédate aquí.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'pattern_interrupt',
    pattern: 'La incómoda verdad sobre {{topic}} que nadie se atreve a decir en voz alta.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'pattern_interrupt',
    pattern: 'Si solo pudiera darte un consejo sobre {{topic}}, sería exactamente este.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'pattern_interrupt',
    pattern: 'Borra todo lo que te han dicho sobre {{topic}}. Empecemos de cero.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'pattern_interrupt',
    pattern: '¿Por qué casi nadie está usando este método para {{desiredGoal}}?',
    recommendedFramework: 'FOMO',
  },
  {
    category: 'pattern_interrupt',
    pattern: 'Hice la prueba durante 30 días con {{topic}} y esto fue lo que pasó.',
    recommendedFramework: 'SocialProof',
  },

  // 2. Contrarian / Myth-Busting (Derribar creencias tradicionales)
  {
    category: 'contrarian',
    pattern: 'Popular no siempre significa efectivo: el gran mito sobre {{topic}}.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'contrarian',
    pattern: 'Por qué seguir {{commonAdvice}} te está costando {{painCost}}.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'contrarian',
    pattern: 'No necesitas más {{commonResource}} para lograr {{desiredGoal}}, necesitas esto.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'contrarian',
    pattern: 'La razón por la que el método tradicional de {{topic}} dejó de funcionar.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'contrarian',
    pattern: 'Lo barato sale caro: por qué elegir por precio en {{topic}} destruye tus resultados.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'contrarian',
    pattern: 'Todo el mundo te dice que hagas A, pero los que realmente ganan hacen B.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'contrarian',
    pattern: 'El error número 1 que veo cometer al 90% de los {{targetAudience}}.',
    recommendedFramework: 'PAS',
  },

  // 3. Negative Warning & Cost of Inaction (Miedo al dolor / Evitar pérdidas)
  {
    category: 'negative_warning',
    pattern: '3 señales de alerta de que tu {{topic}} está a punto de colapsar.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'negative_warning',
    pattern: 'El costo silencioso de postergar {{desiredGoal}} otro mes más.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'negative_warning',
    pattern: 'Si notas esto en tu {{topic}}, actúa antes de que sea tarde.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'negative_warning',
    pattern: '¿Cuánto dinero/tiempo estás perdiendo realmente al día por culpa de {{painAction}}?',
    recommendedFramework: 'PAS',
  },
  {
    category: 'negative_warning',
    pattern: 'La trampa oculta detrás de seguir haciendo {{topic}} a mano.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'negative_warning',
    pattern: 'No contrates ni compres nada de {{topic}} sin antes revisar estos 3 puntos.',
    recommendedFramework: 'DirectOffer',
  },
  {
    category: 'negative_warning',
    pattern: 'El mayor arrepentimiento que tienen los clientes antes de conocernos.',
    recommendedFramework: 'SocialProof',
  },

  // 4. Insider Secret / High-Value Knowledge (Revelación de información privilegiada)
  {
    category: 'insider_secret',
    pattern: 'El checklist de 3 minutos que usamos internamente para {{desiredGoal}}.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'insider_secret',
    pattern: 'Cómo logran los líderes de {{industry}} {{desiredGoal}} sin {{commonFriction}}.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'insider_secret',
    pattern: 'El atajo que descubrimos tras analizar decenas de casos en {{industry}}.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'insider_secret',
    pattern: '3 preguntas que debes hacerte hoy mismo sobre tu {{topic}}.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'insider_secret',
    pattern: 'La técnica poco conocida para transformar {{painPoint}} en una ventaja competitiva.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'insider_secret',
    pattern: 'Lo que ninguna agencia o proveedor de {{industry}} quiere que descubras.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'insider_secret',
    pattern: 'El secreto detrás de los resultados exponenciales en {{topic}}.',
    recommendedFramework: 'SocialProof',
  },

  // 5. Transformation / Case Study (Antes y Después)
  {
    category: 'transformation',
    pattern: 'De {{painState}} a {{desiredState}} en menos de {{timeframe}}: caso real.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'transformation',
    pattern: 'Cómo {{clientName}} resolvió {{painPoint}} sin complicarse la vida.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'transformation',
    pattern: 'Antes tardábamos días en {{painAction}}. Hoy toma exactamente 3 clics.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'transformation',
    pattern: 'La transformación que ocurre cuando dejas de improvisar con {{topic}}.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'transformation',
    pattern: 'Así es como se ve {{desiredGoal}} cuando tienes la herramienta correcta.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'transformation',
    pattern: 'El antes y después que nos convenció de que este es el camino.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'transformation',
    pattern: 'Parecía imposible hasta que aplicamos este cambio en {{topic}}.',
    recommendedFramework: 'BAB',
  },

  // 6. Direct Callout (Llamado a la audiencia específica)
  {
    category: 'direct_callout',
    pattern: 'Atención {{targetAudience}}: si estás cansado de {{painPoint}}, lee esto.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'direct_callout',
    pattern: 'Para los {{targetAudience}} que no tienen tiempo que perder con {{painAction}}.',
    recommendedFramework: 'DirectOffer',
  },
  {
    category: 'direct_callout',
    pattern: 'Si eres {{targetAudience}} en 2026, tu mayor desafío hoy es este.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'direct_callout',
    pattern: 'Solo para {{targetAudience}} comprometidos con {{desiredGoal}}.',
    recommendedFramework: 'FOMO',
  },
  {
    category: 'direct_callout',
    pattern: '¿Tienes un {{productNameOrType}} y sigues lidiando con {{painPoint}}?',
    recommendedFramework: 'PAS',
  },
  {
    category: 'direct_callout',
    pattern: 'Un mensaje directo para quien esté pensando en contratar {{topic}} este mes.',
    recommendedFramework: 'DirectOffer',
  },
  {
    category: 'direct_callout',
    pattern: 'Si cumples estos 3 requisitos, esto resolverá tu {{topic}} para siempre.',
    recommendedFramework: 'DirectOffer',
  },

  // 7. Curiosity Gap & High Engagement (Brecha de curiosidad irresistible)
  {
    category: 'curiosity_gap',
    pattern: 'Hay dos tipos de {{targetAudience}}: los que sufren {{painPoint}} y los que usan esto.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'curiosity_gap',
    pattern: 'Pensábamos que el problema era {{topic}}, pero descubrimos algo mucho peor.',
    recommendedFramework: 'PAS',
  },
  {
    category: 'curiosity_gap',
    pattern: 'La pregunta que todo {{targetAudience}} debería hacerse cada lunes por la mañana.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'curiosity_gap',
    pattern: 'Lo que pasa cuando combinas {{topic}} con una estrategia verdaderamente profesional.',
    recommendedFramework: 'SocialProof',
  },
  {
    category: 'curiosity_gap',
    pattern: 'No es magia ni suerte: es simplemente hacer esto con tu {{topic}}.',
    recommendedFramework: 'BAB',
  },
  {
    category: 'curiosity_gap',
    pattern: 'Una regla simple que cambiará para siempre cómo ves {{topic}}.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'curiosity_gap',
    pattern: '¿Por qué el 99% falla al intentar {{desiredGoal}}? Aquí la respuesta.',
    recommendedFramework: 'Contrarian',
  },
  {
    category: 'curiosity_gap',
    pattern: 'El detalle de 10 segundos que marca toda la diferencia en tu {{topic}}.',
    recommendedFramework: 'DirectOffer',
  },
];

/**
 * Muestrea un conjunto de ganchos recomendados para inyectar como inspiración al prompt del CM.
 */
export function sampleViralHooksForPrompt(count = 6): string[] {
  const shuffled = [...VIRAL_HOOK_FORMULAS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((h) => `• [${h.category.toUpperCase()}] "${h.pattern}" (Alineado con marco: ${h.recommendedFramework})`);
}

