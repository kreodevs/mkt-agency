export interface PublishUtmParams {
  tenantId: string;
  productId: string;
  contentId: string;
  platform: string | null;
  campaignId?: string | null;
  productSlug?: string | null;
}

export interface PublishUtmTags {
  source: string;
  medium: string;
  campaign: string;
  content: string;
}

const PLATFORM_SOURCE: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
  tiktok: 'tiktok',
};

export function buildPublishUtmTags(params: PublishUtmParams): PublishUtmTags {
  const platformKey = params.platform?.trim().toLowerCase() ?? '';
  const source =
    PLATFORM_SOURCE[platformKey] ?? (platformKey || 'mkt-agency');
  const campaign =
    params.campaignId?.slice(0, 8) ??
    (params.productSlug?.trim().toLowerCase().replace(/\s+/g, '-') ||
      params.productId.slice(0, 8));

  return {
    source,
    medium: 'social',
    campaign,
    content: params.contentId,
  };
}

export function buildPublishUtmQuery(tags: PublishUtmTags): string {
  const search = new URLSearchParams({
    utm_source: tags.source,
    utm_medium: tags.medium,
    utm_campaign: tags.campaign,
    utm_content: tags.content,
  });
  return search.toString();
}
