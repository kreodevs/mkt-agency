import type { ResolvedProfileValues } from '../../company-profile/services/profile-section-sync.service';
import {
  DEFAULT_ACCENT,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  getProductBrandVisualKit,
  mergeBrandVisualKitMetadata,
  normalizeBrandVisualStyle,
  normalizeHexColor,
  type BrandVisualStyle,
  type ProductBrandVisualKit,
} from '../../product/domain/brand-visual-kit.metadata.util';
import type { ProductEntity } from '../../product/infrastructure/typeorm/product.entity';
import type { SocialCopyPost } from '../adapters/social-copy.adapter.port';
import {
  CAROUSEL_VISUAL_TEMPLATE,
  DEFAULT_VISUAL_TEMPLATE,
  type VisualTemplateId,
} from './visual-template.constants';

export interface ResolvedVisualBrandKit extends ProductBrandVisualKit {
  productName: string;
  logoAssetId: string | null;
}

export function resolveVisualBrandKit(
  product: ProductEntity | null,
  resolvedProfile: ResolvedProfileValues | null,
): ResolvedVisualBrandKit {
  const fromProduct = product ? getProductBrandVisualKit(product.metadata) : null;
  const prefs = resolvedProfile?.visualPreferences ?? {};
  const style = fromProduct?.style ?? normalizeBrandVisualStyle(prefs.style);
  const primaryColor =
    fromProduct?.primaryColor ??
    normalizeHexColor(prefs.primaryColor, DEFAULT_PRIMARY);
  const secondaryColor = fromProduct?.secondaryColor ?? DEFAULT_SECONDARY;
  const accentColor = fromProduct?.accentColor ?? DEFAULT_ACCENT;

  return {
    style,
    primaryColor,
    secondaryColor,
    accentColor,
    productName: product?.name?.trim() || resolvedProfile?.companyName?.trim() || 'Tu marca',
    logoAssetId: product?.metadata?.logoAssetId
      ? String(product.metadata.logoAssetId)
      : null,
  };
}

export function persistDerivedBrandVisualKit(
  product: ProductEntity,
  kit: ResolvedVisualBrandKit,
): ProductEntity {
  if (getProductBrandVisualKit(product.metadata)) {
    return product;
  }
  product.metadata = mergeBrandVisualKitMetadata(product.metadata, {
    style: kit.style,
    primaryColor: kit.primaryColor,
    secondaryColor: kit.secondaryColor,
    accentColor: kit.accentColor,
  });
  return product;
}

export function isVisualTemplateId(value: string | null | undefined): value is VisualTemplateId {
  return (
    value === 'product-hero' ||
    value === 'tip-card' ||
    value === 'quote-insight' ||
    value === 'promo-cta' ||
    value === 'stat-highlight' ||
    value === 'story-vertical'
  );
}

export function resolveVisualTemplateId(
  post: Pick<SocialCopyPost, 'visualFormat' | 'platform' | 'visualTemplateId' | 'body' | 'title'>,
): VisualTemplateId {
  if (isVisualTemplateId(post.visualTemplateId)) {
    return post.visualTemplateId;
  }

  if (post.visualFormat === 'carousel') {
    return CAROUSEL_VISUAL_TEMPLATE;
  }

  if (post.platform === 'tiktok') {
    return 'story-vertical';
  }

  if (/\b\d+[%$]|\d+\s*(clientes|ventas|años|usuarios)/i.test(post.body)) {
    return 'stat-highlight';
  }

  if (post.platform === 'linkedin' && post.body.length > 280) {
    return 'quote-insight';
  }

  if (/\b(nuevo|lanzamiento|oferta|descuento|promo|registro|agenda)\b/i.test(post.body)) {
    return 'promo-cta';
  }

  if (post.body.includes('?') || /^tip\b/i.test(post.title)) {
    return 'tip-card';
  }

  return DEFAULT_VISUAL_TEMPLATE;
}

export function buildCompetitorVisualAngle(
  competitorIntelBrief: Record<string, unknown> | null | undefined,
): string | null {
  if (!competitorIntelBrief) {
    return null;
  }

  const recommendation = competitorIntelBrief.recommendation;
  if (typeof recommendation === 'string' && recommendation.trim()) {
    return recommendation.trim().slice(0, 220);
  }

  const gaps = competitorIntelBrief.marketGaps;
  if (Array.isArray(gaps) && gaps.length > 0) {
    const first = gaps[0];
    if (typeof first === 'string' && first.trim()) {
      return `Diferenciador: ${first.trim().slice(0, 180)}`;
    }
  }

  return null;
}

export function styleLabel(style: BrandVisualStyle): string {
  switch (style) {
    case 'bold':
      return 'diseño audaz, alto contraste, bloques de color';
    case 'luxury':
      return 'estética premium, espacios amplios, elegante';
    default:
      return 'diseño limpio, minimalista, legible';
  }
}
