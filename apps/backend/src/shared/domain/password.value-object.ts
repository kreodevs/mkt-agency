import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

const PASSWORD_POLICY =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export class Password {
  private constructor(private readonly hash: string) {}

  static async createFromPlaintext(plain: string): Promise<Password> {
    if (!PASSWORD_POLICY.test(plain)) {
      throw new BadRequestException({
        error: 'Password does not meet policy requirements',
        code: 'VALIDATION_ERROR',
        details:
          'Minimum 8 characters, at least one uppercase letter, one number, and one special character.',
      });
    }

    const hash = await argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      parallelism: 4,
    });

    return new Password(hash);
  }

  static async verify(plain: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  toHash(): string {
    return this.hash;
  }
}
