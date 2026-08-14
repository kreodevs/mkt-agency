import { normalizeHexColor, DEFAULT_PRIMARY } from '../../product/domain/brand-visual-kit.metadata.util';
import { buildCompetitorVisualAngle, styleLabel, type ResolvedVisualBrandKit } from './visual-brand-kit.util';

export function enrichVisualDescriptionForAi(
  visualDescription: string,
  brandKit: Pick<
    ResolvedVisualBrandKit,
    'style' | 'primaryColor' | 'secondaryColor' | 'productName'
  >,
  competitorIntelBrief?: Record<string, unknown> | null,
): string {
  const parts = [visualDescription.trim()];
  const primary = normalizeHexColor(brandKit.primaryColor, DEFAULT_PRIMARY);

  parts.push(
    `Paleta de marca: primario ${primary}, secundario ${brandKit.secondaryColor}.`,
    `Estilo visual: ${styleLabel(brandKit.style)}.`,
    `Producto/marca: ${brandKit.productName}. Evita stock genérico de oficina o ejecutivos anónimos.`,
  );

  const angle = buildCompetitorVisualAngle(competitorIntelBrief);
  if (angle) {
    parts.push(`Ángulo diferenciador frente a competencia: ${angle}`);
  }

  return parts.filter(Boolean).join(' ');
}
