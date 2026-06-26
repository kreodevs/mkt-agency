import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../shared/redis/redis.module';
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_SECONDS,
  RateLimitTier,
} from '../domain/rate-limit.constants';
import { RateLimitExceededException } from '../exceptions/rate-limit-exceeded.exception';

@Injectable()
export class RateLimitService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async assertWithinLimit(tier: RateLimitTier, identifier: string): Promise<void> {
    const window = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
    const key = `ratelimit:${tier}:${identifier}:${window}`;
    const max = RATE_LIMIT_MAX[tier];

    try {
      if (this.redis.status !== 'ready') {
        await this.redis.connect();
      }

      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
      }

      if (count > max) {
        throw new RateLimitExceededException();
      }
    } catch (err) {
      if (err instanceof Error && 'statusCode' in err) {
        throw err;
      }
      // Redis caído: no bloquear tráfico en dev/MVP
      return;
    }
  }
}
