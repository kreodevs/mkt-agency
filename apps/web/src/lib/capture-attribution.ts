export interface CaptureAttribution {
  contentId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  productId?: string;
}

/** URL pública de captura con UTM para atribuir lead → post. */
export function buildCapturePageUrl(
  formId: string,
  attribution: CaptureAttribution,
  baseUrl = window.location.origin,
): string {
  const url = new URL(`/c/${formId}`, baseUrl);

  if (attribution.contentId) {
    url.searchParams.set('utm_content', attribution.contentId);
    url.searchParams.set('contentId', attribution.contentId);
  }
  if (attribution.utm_source) {
    url.searchParams.set('utm_source', attribution.utm_source);
  }
  if (attribution.utm_medium) {
    url.searchParams.set('utm_medium', attribution.utm_medium);
  } else if (attribution.utm_source) {
    url.searchParams.set('utm_medium', 'social');
  }
  if (attribution.utm_campaign) {
    url.searchParams.set('utm_campaign', attribution.utm_campaign);
  } else if (attribution.productId) {
    url.searchParams.set('utm_campaign', attribution.productId);
  }

  return url.toString();
}

export function parseCaptureAttributionFromSearch(
  search: string,
): CaptureAttribution {
  const params = new URLSearchParams(search);
  const attribution: CaptureAttribution = {};

  const contentId = params.get('utm_content') ?? params.get('contentId');
  if (contentId) attribution.contentId = contentId;
  if (params.get('utm_source')) attribution.utm_source = params.get('utm_source')!;
  if (params.get('utm_medium')) attribution.utm_medium = params.get('utm_medium')!;
  if (params.get('utm_campaign')) attribution.utm_campaign = params.get('utm_campaign')!;

  return attribution;
}
