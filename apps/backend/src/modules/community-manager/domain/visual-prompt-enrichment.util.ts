import { normalizeHexColor, DEFAULT_PRIMARY } from '../../product/domain/brand-visual-kit.metadata.util';
import { buildCompetitorVisualAngle, styleLabel, type ResolvedVisualBrandKit } from './visual-brand-kit.util';

export function enrichVisualDescriptionForAi(
  visualDescription: string,
  brandKit: Pick<
    ResolvedVisualBrandKit,
    'style' | 'primaryColor' | 'secondaryColor' | 'productName' | 'logoAssetId'
  >,
  competitorIntelBrief?: Record<string, unknown> | null,
  options?: { hasLogo?: boolean },
): string {
  const parts = [visualDescription.trim()];
  const primary = normalizeHexColor(brandKit.primaryColor, DEFAULT_PRIMARY);
  const hasLogo = options?.hasLogo ?? Boolean(brandKit.logoAssetId);

  parts.push(
    `Paleta de marca: primario ${primary}, secundario ${brandKit.secondaryColor}.`,
    `Estilo visual: ${styleLabel(brandKit.style)}.`,
  );

  if (hasLogo) {
    parts.push(
      'Identidad de marca solo mediante logo superpuesto después — NO escribas el nombre de la marca ni wordmarks en la escena.',
    'CERO TEXTO DENTRO DE LA FOTOGRAFÍA: La imagen debe ser 100% limpia sin ninguna palabra, título, frase, letra ni texto en ningún idioma (sin texto en inglés, italiano ni español). Toda la tipografía se superpone después mediante software. Genera únicamente la escena fotográfica.',
    );
  } else {
    parts.push(
      `Producto/marca: ${brandKit.productName}. Evita stock genérico de oficina o ejecutivos anónimos.`,
    );
  }

  const angle = buildCompetitorVisualAngle(competitorIntelBrief);
  if (angle) {
    parts.push(`Ángulo diferenciador frente a competencia: ${angle}`);
  }

  return parts.filter(Boolean).join(' ');
}
