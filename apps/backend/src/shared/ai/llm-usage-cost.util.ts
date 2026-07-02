export function estimateTokenCostUsd(
  promptTokens: number,
  completionTokens: number,
  inputCostPer1M?: number | null,
  outputCostPer1M?: number | null,
): number {
  const inputRate = inputCostPer1M ?? 0;
  const outputRate = outputCostPer1M ?? 0;
  return (
    (promptTokens / 1_000_000) * inputRate + (completionTokens / 1_000_000) * outputRate
  );
}

export function roundCostUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/** Estimación conservadora cuando OpenRouter no devuelve tokens (video por segundo). */
export function estimateVideoCostUsd(durationSeconds: number, costPerSecond = 0.121): number {
  return roundCostUsd(Math.max(0, durationSeconds) * costPerSecond);
}
