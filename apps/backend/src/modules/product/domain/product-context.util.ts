import { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import { extractProductSummary } from '../../competitors/domain/competitor-discovery-context.util';
import { ProductEntity } from '../infrastructure/typeorm/product.entity';

export interface ProductContext {
  id: string;
  name: string;
  description: string | null;
  valueProposition: string | null;
  targetAudience: string | null;
  keywords: string[];
  category: string | null;
  priceRange: string | null;
}

export function toProductContext(product: ProductEntity): ProductContext {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    valueProposition: product.valueProposition,
    targetAudience: product.targetAudience,
    keywords: Array.isArray(product.keywords) ? product.keywords.map(String) : [],
    category: product.category,
    priceRange: product.priceRange,
  };
}

export function productSummaryForDiscovery(
  product: ProductContext | null,
  brand: ResolvedProfileValues,
  brandBrief?: Record<string, unknown> | null,
): string | null {
  if (product?.valueProposition?.trim()) {
    return `${product.name}: ${product.valueProposition.trim()}`;
  }
  if (product?.description?.trim()) {
    return `${product.name}: ${product.description.trim()}`;
  }
  if (product?.name) {
    return product.name;
  }

  return extractProductSummary(brand, brandBrief);
}

export function mergeBrandAndProductBrief(
  brand: ResolvedProfileValues | null,
  product: ProductContext | null,
): Record<string, unknown> | null {
  if (!brand?.companyName?.trim() && !product) {
    return null;
  }

  return {
    companyName: brand?.companyName ?? null,
    industry: brand?.industry ?? null,
    brandVoice: brand?.brandVoice ?? null,
    website: brand?.website ?? null,
    objectives: brand?.objectives ?? [],
    focusProduct: product?.name ?? null,
    productDescription: product?.description ?? null,
    valueProposition: product?.valueProposition ?? null,
    targetAudience: product?.targetAudience ?? brand?.targetAudienceDesc ?? null,
    keywords: product?.keywords ?? [],
    category: product?.category ?? null,
    priceRange: product?.priceRange ?? null,
  };
}

export function buildCampaignObjective(
  product: ProductContext | null,
  brand: ResolvedProfileValues,
): string {
  if (product?.valueProposition?.trim()) {
    return `Promocionar ${product.name}: ${product.valueProposition.trim()}`;
  }

  if (product?.description?.trim()) {
    return `Campaña para ${product.name}: ${product.description.trim()}`;
  }

  if (brand.objectives.length > 0) {
    return `Campaña multicanal alineada a: ${brand.objectives.slice(0, 3).join('; ')}`;
  }

  if (product?.targetAudience?.trim()) {
    return `Generar awareness y conversión de ${product.name} con ${product.targetAudience.trim()}`;
  }

  if (brand.targetAudienceDesc?.trim()) {
    return `Generar awareness y conversión con ${brand.targetAudienceDesc.trim()}`;
  }

  return 'Campaña multicanal generada automáticamente a partir del contexto de agentes IA';
}

export function isProductReadyForCampaign(product: ProductEntity | null | undefined): boolean {
  if (!product || product.status !== 'active') {
    return false;
  }

  const hasDescription = Boolean(product.description?.trim() || product.valueProposition?.trim());
  const hasAudience = Boolean(product.targetAudience?.trim());

  return hasDescription && hasAudience;
}
