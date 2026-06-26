import { HttpException, HttpStatus } from '@nestjs/common';

export class TenantNotFoundException extends HttpException {
  constructor() {
    super(
      { error: 'Tenant not found', code: 'NOT_FOUND' },
      HttpStatus.NOT_FOUND,
    );
  }
}
