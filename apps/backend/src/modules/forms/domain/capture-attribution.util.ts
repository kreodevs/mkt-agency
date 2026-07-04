export interface CaptureAttribution {
  contentId?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  productId?: string;
}

const ATTRIBUTION_KEYS = [
  'contentId',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'productId',
] as const;

export function extractCaptureAttribution(
  payload: Record<string, unknown>,
): CaptureAttribution {
  const result: CaptureAttribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }
  return result;
}

export function mergeLeadAttributionMetadata(
  existing: Record<string, unknown>,
  attribution: CaptureAttribution,
): Record<string, unknown> {
  return {
    ...existing,
    ...attribution,
    lastAttributionAt: new Date().toISOString(),
  };
}
