export interface LlmModelOption {
  id: string;
  name: string;
  inputCostPer1M: number | null;
  outputCostPer1M: number | null;
  contextLength: number | null;
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

export function formatModelOptionLabel(model: LlmModelOption): string {
  const input = formatCostPer1M(model.inputCostPer1M);
  const output = formatCostPer1M(model.outputCostPer1M);
  const ctx = model.contextLength
    ? ` · ctx ${Math.round(model.contextLength / 1000)}k`
    : '';
  return `${model.name} — entrada: ${input}/1M · salida: ${output}/1M${ctx}`;
}
