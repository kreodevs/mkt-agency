import { HttpException, HttpStatus } from '@nestjs/common';

export class SuperadminAlreadyExistsException extends HttpException {
  constructor() {
    super(
      { error: 'Superadmin already exists', code: 'CONFLICT' },
      HttpStatus.CONFLICT,
    );
  }
}
