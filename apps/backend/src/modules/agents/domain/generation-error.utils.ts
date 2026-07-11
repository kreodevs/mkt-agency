/** Tiempo sin actualizar antes de considerar atascada una generación en cola (video puede tardar ~10 min). */
export const IMAGE_GENERATION_STALE_PROCESSING_MS = 20 * 60 * 1000;

export const IMAGE_GENERATION_STALE_PROCESSING_MESSAGE =
  'La generación tardó demasiado o se interrumpió. Puedes reintentar.';

export function formatGenerationError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Generation failed';

  if (/ffmpeg: not found/i.test(raw) || /FFmpeg concatenation failed/i.test(raw)) {
    return 'FFmpeg no está disponible en el worker. Redeploy de api+worker con rebuild (sin caché) y pulsa Reintentar. Ver GET /api/v1/setup/status → runtime.ffmpegAvailable.';
  }

  if (/unexpected internal error/i.test(raw)) {
    return 'El proveedor de IA devolvió un error interno. Reintenta en unos minutos o cambia el modelo en Ajustes → Modelos por tarea.';
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { error?: { message?: string } };
      const providerMessage = parsed.error?.message?.trim();
      if (providerMessage) {
        return providerMessage;
      }
    } catch {
      // ignore malformed JSON tail
    }
  }

  return raw.length > 500 ? `${raw.slice(0, 497)}…` : raw;
}

export function isStaleProcessingGeneration(
  record: { status: string; updatedAt: Date | string },
  now = Date.now(),
): boolean {
  if (record.status !== 'processing') {
    return false;
  }

  const updatedAtMs =
    record.updatedAt instanceof Date
      ? record.updatedAt.getTime()
      : Date.parse(record.updatedAt);

  return (
    Number.isFinite(updatedAtMs) &&
    now - updatedAtMs > IMAGE_GENERATION_STALE_PROCESSING_MS
  );
}
