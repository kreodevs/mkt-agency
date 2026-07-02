export interface LlmModelOption {
  id: string;
  name: string;
  inputCostPer1M: number | null;
  outputCostPer1M: number | null;
  contextLength: number | null;
  source?: 'chat' | 'image' | 'video';
  outputModalities?: string[];
}

export interface LlmModelsListResponse {
  providerId: string;
  providerName: string;
  models: LlmModelOption[];
}

export function formatCostPer1M(usd: number | null | undefined): string {
  if (usd == null) return '—';
  if (usd === 0) return '$0';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

export function modelSupportsVideo(model: LlmModelOption): boolean {
  return (
    model.source === 'video' ||
    model.outputModalities?.includes('video') === true
  );
}

export function formatModelOptionLabel(model: LlmModelOption): string {
  if (model.source === 'video') {
    return `${model.name} — Video API · ${model.id}`;
  }

  if (model.source === 'image') {
    return `${model.name} — Image API · ${model.id}`;
  }

  const input = formatCostPer1M(model.inputCostPer1M);
  const output = formatCostPer1M(model.outputCostPer1M);
  const ctx = model.contextLength
    ? ` · ctx ${Math.round(model.contextLength / 1000)}k`
    : '';
  return `${model.name} — entrada: ${input}/1M · salida: ${output}/1M${ctx}`;
}

export function modelSupportsImages(model: LlmModelOption): boolean {
  return (
    model.source === 'image' ||
    model.outputModalities?.includes('image') === true
  );
}

export function filterLlmModels(
  models: LlmModelOption[],
  query: string,
  limit = 80,
): LlmModelOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return models.slice(0, limit);
  }

  return models
    .filter(
      (model) =>
        model.id.toLowerCase().includes(normalized) ||
        model.name.toLowerCase().includes(normalized),
    )
    .slice(0, limit);
}

export function sortModelsForTask(
  models: LlmModelOption[],
  taskType?: string,
): LlmModelOption[] {
  if (taskType === 'video_generation') {
    return [...models].sort((a, b) => {
      const aVideo = modelSupportsVideo(a) ? 0 : 1;
      const bVideo = modelSupportsVideo(b) ? 0 : 1;
      if (aVideo !== bVideo) {
        return aVideo - bVideo;
      }
      return a.name.localeCompare(b.name, 'es');
    });
  }

  if (taskType !== 'image_generation') {
    return models;
  }

  return [...models].sort((a, b) => {
    const aImage = modelSupportsImages(a) ? 0 : 1;
    const bImage = modelSupportsImages(b) ? 0 : 1;
    if (aImage !== bImage) {
      return aImage - bImage;
    }
    return a.name.localeCompare(b.name, 'es');
  });
}

/** OpenRouter: quita el sufijo `:free` para obtener el modelo de pago equivalente. */
export function suggestPaidFallbackModelId(modelId: string): string | null {
  const trimmed = modelId.trim();
  if (!trimmed.endsWith(':free')) {
    return null;
  }

  const paid = trimmed.replace(/:free$/, '');
  return paid.length > 0 && paid !== trimmed ? paid : null;
}
