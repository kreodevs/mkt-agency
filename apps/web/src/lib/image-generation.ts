import type { ImageGenerationMetadata } from '@/types/agents';

export function parseImageGenerationMetadata(
  metadata: unknown,
): ImageGenerationMetadata | null {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const record = metadata as ImageGenerationMetadata;
  if (!Array.isArray(record.frames) || record.frames.length === 0) {
    return null;
  }

  return {
    mediaType: record.mediaType,
    mimeType: record.mimeType,
    duration: record.duration,
    frameCount: record.frameCount ?? record.frames.length,
    frames: record.frames.filter(
      (frame): frame is { assetId: string; index: number } =>
        typeof frame?.assetId === 'string' && typeof frame?.index === 'number',
    ),
  };
}

export function isVideoGeneration(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false;
  }

  return (metadata as ImageGenerationMetadata).mediaType === 'video';
}

/** Mismo umbral que el backend: generación en cola sin actualizar >20 min. */
export const IMAGE_GENERATION_STALE_PROCESSING_MS = 20 * 60 * 1000;

export function isStaleImageGeneration(generation: {
  status: string;
  updatedAt: string;
}): boolean {
  if (generation.status !== 'processing') {
    return false;
  }

  const updatedAtMs = Date.parse(generation.updatedAt);
  return (
    Number.isFinite(updatedAtMs) &&
    Date.now() - updatedAtMs > IMAGE_GENERATION_STALE_PROCESSING_MS
  );
}

export function listGenerationAssetIds(generation: {
  assetId: string | null;
  metadata?: unknown;
}): string[] {
  const parsed = parseImageGenerationMetadata(generation.metadata);
  if (parsed?.frames.length) {
    return parsed.frames.map((frame) => frame.assetId);
  }

  return generation.assetId ? [generation.assetId] : [];
}

export function extractContentAssetIds(assets: unknown[] | undefined): string[] {
  if (!assets?.length) {
    return [];
  }

  return assets
    .map((asset) => {
      if (typeof asset === 'string') {
        return asset;
      }
      if (asset && typeof asset === 'object' && 'id' in asset) {
        const id = (asset as { id?: unknown }).id;
        return typeof id === 'string' ? id : null;
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}

export function resolveContentVisualAssetIds(input: {
  generation?: { assetId: string | null; metadata?: unknown; status?: string } | null;
  versionAssets?: unknown[];
}): string[] {
  const generation = input.generation;

  if (generation?.status === 'processing') {
    return [];
  }

  if (generation?.status === 'completed') {
    const fromGeneration = listGenerationAssetIds(generation);
    if (fromGeneration.length) {
      return fromGeneration;
    }
  }

  return extractContentAssetIds(input.versionAssets);
}
