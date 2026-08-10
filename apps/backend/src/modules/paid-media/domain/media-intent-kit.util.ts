import type { CreativePackPayload } from '../../agency-agents/domain/handoff/creative-pack.types';
import type { MediaCampaignIntentEntity } from '../infrastructure/typeorm/media-campaign-intent.entity';

export interface MediaIntentKitExport {
  filename: string;
  markdown: string;
  checklist: string[];
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta (Facebook / Instagram)',
  facebook: 'Meta (Facebook)',
  instagram: 'Meta (Instagram)',
  google: 'Google Ads',
  google_ads: 'Google Ads',
  tiktok: 'TikTok Ads',
};

export function buildMediaIntentKitMarkdown(
  intent: MediaCampaignIntentEntity,
  creativePack?: CreativePackPayload | null,
): MediaIntentKitExport {
  const platformLabel = PLATFORM_LABELS[intent.platform.toLowerCase()] ?? intent.platform;
  const structure = intent.structure as {
    mode?: string;
    note?: string;
    adSets?: Array<{
      name?: string;
      copy?: {
        headline?: string;
        primaryText?: string;
        cta?: string;
        visualDirection?: string;
        format?: string;
      };
      bidding?: string;
      optimization?: string;
    }>;
    hypotheses?: CreativePackPayload['hypotheses'];
  };

  const adSets = structure.adSets ?? [];
  const hypotheses = structure.hypotheses ?? creativePack?.hypotheses ?? [];
  const dailyBudget = intent.dailyBudget ? Number(intent.dailyBudget) : null;
  const totalBudget = intent.totalBudget ? Number(intent.totalBudget) : null;

  const lines: string[] = [
    `# Kit de pauta — ${intent.name}`,
    '',
    `**Plataforma:** ${platformLabel}`,
    `**Estado:** ${intent.status}`,
    `**Generado:** ${intent.createdAt.toISOString()}`,
    '',
    '> Ejecuta manualmente en Ads Manager. El dueño del negocio aprueba presupuesto y creativos.',
    '',
  ];

  if (dailyBudget != null || totalBudget != null) {
    lines.push('## Presupuesto sugerido', '');
    if (dailyBudget != null) {
      lines.push(`- Diario: **$${dailyBudget.toFixed(2)}**`);
    }
    if (totalBudget != null) {
      lines.push(`- Mensual (esta plataforma): **$${totalBudget.toFixed(2)}**`);
    }
    lines.push('');
  }

  if (hypotheses.length > 0) {
    lines.push('## Hipótesis a probar', '');
    for (const hypothesis of hypotheses) {
      lines.push(
        `- **${hypothesis.angle}** — dolor: ${hypothesis.painPoint}; lift esperado: ${hypothesis.expectedLift}`,
      );
    }
    lines.push('');
  }

  if (adSets.length > 0) {
    lines.push('## Anuncios', '');
    adSets.forEach((set, index) => {
      const copy = set.copy;
      lines.push(`### ${set.name ?? `Ad Set ${index + 1}`}`, '');
      if (copy?.headline) {
        lines.push(`**Titular:** ${copy.headline}`, '');
      }
      if (copy?.primaryText) {
        lines.push('**Texto principal:**', '', copy.primaryText, '');
      }
      if (copy?.cta) {
        lines.push(`**CTA:** ${copy.cta}`, '');
      }
      if (copy?.visualDirection) {
        lines.push(`**Dirección visual:** ${copy.visualDirection}`, '');
      }
      if (set.bidding || set.optimization) {
        lines.push(
          `_Puja: ${set.bidding ?? '—'} · Optimización: ${set.optimization ?? '—'}_`,
          '',
        );
      }
    });
  }

  if (structure.note) {
    lines.push('## Notas', '', structure.note, '');
  }

  const checklist = buildChecklist(platformLabel, adSets.length);

  lines.push('## Checklist de lanzamiento', '');
  checklist.forEach((item, index) => {
    lines.push(`${index + 1}. [ ] ${item}`);
  });
  lines.push('');

  const slug = intent.platform.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const date = intent.createdAt.toISOString().slice(0, 10);

  return {
    filename: `kit-pauta-${slug}-${date}.md`,
    markdown: lines.join('\n'),
    checklist,
  };
}

function buildChecklist(platformLabel: string, adSetCount: number): string[] {
  const items = [
    'Revisar copys y creativos en la bandeja antes de publicar',
    `Crear campaña en ${platformLabel}`,
    'Configurar audiencia y ubicaciones según tu perfil de cliente',
  ];

  if (adSetCount > 1) {
    items.push(`Crear ${adSetCount} conjuntos de anuncios (uno por variante)`);
  } else {
    items.push('Crear al menos un conjunto de anuncios');
  }

  items.push(
    'Pegar titular, texto y CTA de este kit',
    'Subir imágenes o videos desde tu librería de recursos',
    'Definir presupuesto diario dentro de tu tope mensual',
    'Publicar y marcar como «lanzado manual» en la plataforma',
  );

  return items;
}
