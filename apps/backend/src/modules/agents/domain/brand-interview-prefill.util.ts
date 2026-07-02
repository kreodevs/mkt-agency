import { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';

export interface BrandInterviewProfileContext {
  companyName?: string | null;
  industry?: string | null;
  brandVoice?: string | null;
  targetAudienceDesc?: string | null;
  competitors?: string | null;
  objectives?: unknown;
}

const CATEGORY_LABELS: Record<string, string> = {
  physical: 'Producto físico',
  digital: 'Producto digital',
  service: 'Servicio',
  subscription: 'Suscripción',
  other: 'Otro',
};

function formatCategory(category: string | null | undefined): string | null {
  if (!category?.trim()) return null;
  return CATEGORY_LABELS[category] ?? category;
}

function formatKeywords(keywords: unknown): string | null {
  if (!Array.isArray(keywords)) return null;
  const items = keywords.map((k) => String(k).trim()).filter(Boolean);
  return items.length > 0 ? items.join(', ') : null;
}

function formatObjectives(objectives: unknown): string | null {
  if (!Array.isArray(objectives) || objectives.length === 0) return null;
  return objectives
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'title' in item) {
        return String((item as { title?: unknown }).title ?? '').trim();
      }
      return String(item).trim();
    })
    .filter(Boolean)
    .join('; ');
}

export function buildBrandInterviewAnswersFromOnboarding(
  product: ProductEntity,
  profile: BrandInterviewProfileContext | null,
): Record<string, string> {
  const companyLabel = profile?.companyName?.trim() || product.name.trim();
  const productLines = [
    `Producto: ${product.name.trim()}`,
    product.description?.trim() ? `Descripción: ${product.description.trim()}` : null,
    product.valueProposition?.trim()
      ? `Propuesta de valor: ${product.valueProposition.trim()}`
      : null,
  ].filter(Boolean);

  const companyName = [
    profile?.companyName?.trim() ? `Empresa: ${profile.companyName.trim()}` : null,
    ...productLines,
  ]
    .filter(Boolean)
    .join('. ');

  const industry =
    formatCategory(product.category as string | null) ??
    profile?.industry?.trim() ??
    'Por definir según categoría del producto';

  const targetAudienceDesc =
    product.targetAudience?.trim() ??
    profile?.targetAudienceDesc?.trim() ??
    'Audiencia por definir';

  const keywordText = formatKeywords(product.keywords);
  const brandVoice =
    profile?.brandVoice?.trim() ??
    (keywordText
      ? `Tono alineado al posicionamiento del producto. Palabras clave de referencia: ${keywordText}.`
      : 'Tono profesional acorde a la propuesta de valor del producto.');

  const competitors =
    profile?.competitors?.trim() ??
    (keywordText
      ? `Competidores a validar en el mercado relacionado con: ${keywordText}.`
      : 'Competidores por identificar en el sector del producto.');

  const objectives =
    formatObjectives(profile?.objectives) ??
    (product.valueProposition?.trim()
      ? `Promover ${product.name.trim()} destacando: ${product.valueProposition.trim()}.`
      : `Aumentar visibilidad y conversión de ${product.name.trim()}.`);

  return {
    companyName,
    industry,
    targetAudienceDesc,
    brandVoice,
    competitors,
    objectives,
  };
}
