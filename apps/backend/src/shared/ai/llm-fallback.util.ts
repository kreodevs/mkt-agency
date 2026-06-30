/** OpenRouter free-tier models use the `:free` suffix; paid tier drops it. */
export function suggestPaidFallbackModel(model: string): string | null {
  const trimmed = model.trim();
  if (!trimmed.endsWith(':free')) {
    return null;
  }

  const paid = trimmed.replace(/:free$/, '');
  return paid.length > 0 && paid !== trimmed ? paid : null;
}

export function isLlmRateLimitError(status: number, errorBody: string): boolean {
  if (status === 429) {
    return true;
  }

  const normalized = errorBody.toLowerCase();
  return (
    normalized.includes('rate-limited') ||
    normalized.includes('rate limit') ||
    normalized.includes('too many requests')
  );
}

export function isLlmRetryableWithFallback(status: number, errorBody: string): boolean {
  if (isLlmRateLimitError(status, errorBody)) {
    return true;
  }

  if (status === 503 || status === 502) {
    return true;
  }

  return false;
}
