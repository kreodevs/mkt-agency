import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitExceededException extends HttpException {
  constructor() {
    super({ error: 'Too many requests', code: 'RATE_LIMITED' }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
