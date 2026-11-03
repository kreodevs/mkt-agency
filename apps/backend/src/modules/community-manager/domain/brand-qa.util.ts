import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';

const BANNED_AD_TERMS = [
  'dinero fácil',
  'dinero facil',
  'ganancias garantizadas sin esfuerzo',
  'hágase rico de la noche a la mañana',
  'hagase rico de la noche a la manana',
  'cura milagrosa',
  '100% garantizado sin riesgo',
  'sin ningún riesgo',
  'sin ningun riesgo',
  'esquema piramidal',
  'fórmula mágica para duplicar tus ingresos',
  'formula magica para duplicar tus ingresos',
];

const PASSIVE_GREETINGS = [
  /^¡?hola a todos/i,
  /^¡?hola comunidad/i,
  /^hoy les quiero compartir/i,
  /^en este post quiero hablarles/i,
  /^en el mundo actual/i,
  /^en el vertiginoso mundo/i,
  /^buenos días a todos/i,
  /^buenas tardes a todos/i,
];

export interface BrandQaAuditResult {
  passed: boolean;
  score: number; // 0 - 100
  sanitizedBody: string;
  violations: string[];
  warnings: string[];
}

export function runBrandQaAudit(post: Partial<SocialCopyPost> & { body: string }): BrandQaAuditResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  let body = post.body.trim();

  // 1. Audit banned ad terms (ad policies compliance)
  const lowerBody = body.toLowerCase();
  for (const term of BANNED_AD_TERMS) {
    if (lowerBody.includes(term)) {
      violations.push(`Término prohibido por políticas de pauta/redes: "${term}"`);
      score -= 25;
      // Sanitize: replace with safer professional phrasing
      const regex = new RegExp(term, 'gi');
      body = body.replace(regex, 'resultados comprobados con método consistente');
    }
  }

  // 2. Audit scroll-stopper quality (first line must not be passive greeting)
  const lines = body.split('\n').filter((l) => l.trim().length > 0);
  const firstLine = lines[0] ?? '';
  for (const pattern of PASSIVE_GREETINGS) {
    if (pattern.test(firstLine)) {
      warnings.push(`Línea inicial con saludo pasivo: "${firstLine}". Rediseñando gancho.`);
      score -= 15;
      // Remove passive greeting and promote the next strong line
      lines.shift();
      if (lines.length > 0) {
        body = lines.join('\n\n');
      }
      break;
    }
  }

  // 3. Visual Headline audit (3-12 words max, no hashtags inside design)
  if (post.visualHeadline) {
    if (post.visualHeadline.includes('#')) {
      warnings.push('El titular visual contiene hashtags. Se retiraron para cuidar la estética gráfica.');
      post.visualHeadline = post.visualHeadline.replace(/#\w+/g, '').trim();
      score -= 10;
    }
    const wordCount = post.visualHeadline.split(/\s+/).length;
    if (wordCount > 14) {
      warnings.push(`Titular visual demasiado extenso (${wordCount} palabras). Se recomienda ≤ 10 palabras.`);
      score -= 10;
    }
  }

  // 4. Hashtag stuffing check (no more than 5 hashtags)
  if (post.hashtags && post.hashtags.length > 5) {
    warnings.push(`Exceso de hashtags (${post.hashtags.length}). Se recomienda entre 1 y 3 hashtags de nicho.`);
    post.hashtags = post.hashtags.slice(0, 3);
    score -= 5;
  }

  const passed = violations.length === 0;

  return {
    passed,
    score: Math.max(0, score),
    sanitizedBody: body,
    violations,
    warnings,
  };
}
