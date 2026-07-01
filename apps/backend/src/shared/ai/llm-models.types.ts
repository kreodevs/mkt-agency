export interface LlmModelOption {
  id: string;
  name: string;
  /** USD per 1M input tokens */
  inputCostPer1M: number | null;
  /** USD per 1M output tokens */
  outputCostPer1M: number | null;
  contextLength: number | null;
  /** Catálogo chat (`/models`) o Image API (`/images/models`). */
  source?: 'chat' | 'image';
  outputModalities?: string[];
}

export interface LlmModelsListResponse {
  providerId: string;
  providerName: string;
  models: LlmModelOption[];
}
