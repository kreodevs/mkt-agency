export type RateLimitTier = 'public' | 'auth' | 'ai';

export const RATE_LIMIT_MAX: Record<RateLimitTier, number> = {
  public: 100,
  auth: 1000,
  ai: 20,
};

export const RATE_LIMIT_WINDOW_SECONDS = 60;
