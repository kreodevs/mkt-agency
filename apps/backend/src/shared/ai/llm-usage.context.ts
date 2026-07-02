import { AsyncLocalStorage } from 'node:async_hooks';

export interface LlmUsageContextState {
  tenantId?: string | null;
  userId?: string | null;
}

const storage = new AsyncLocalStorage<LlmUsageContextState>();

export function getLlmUsageContext(): LlmUsageContextState {
  return storage.getStore() ?? {};
}

export function runWithLlmUsageContext<T>(
  state: LlmUsageContextState,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  const current = getLlmUsageContext();
  return storage.run({ ...current, ...state }, fn);
}
