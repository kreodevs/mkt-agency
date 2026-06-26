import { HttpException, HttpStatus } from '@nestjs/common';

export class SlugAlreadyExistsException extends HttpException {
  constructor() {
    super(
      { error: 'Slug already exists', code: 'CONFLICT' },
      HttpStatus.CONFLICT,
    );
  }
}
