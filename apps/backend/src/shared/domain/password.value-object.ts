import { BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';

const PASSWORD_POLICY =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const ARGON2_HASH_PREFIX = /^\$argon2/i;
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$/;

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

    return Password.fromPlaintextWithoutPolicyCheck(plain);
  }

  /** Rehash after legacy bcrypt verification (policy already satisfied historically). */
  static async upgradeFromPlaintext(plain: string): Promise<Password> {
    return Password.fromPlaintextWithoutPolicyCheck(plain);
  }

  static isLegacyBcryptHash(hash: string): boolean {
    return BCRYPT_HASH_PREFIX.test(hash);
  }

  static isArgon2Hash(hash: string): boolean {
    return ARGON2_HASH_PREFIX.test(hash);
  }

  static async verify(plain: string, hash: string): Promise<boolean> {
    if (!hash) {
      return false;
    }

    if (Password.isArgon2Hash(hash)) {
      return argon2.verify(hash, plain);
    }

    if (Password.isLegacyBcryptHash(hash)) {
      return bcrypt.compare(plain, hash);
    }

    return false;
  }

  toHash(): string {
    return this.hash;
  }

  private static async fromPlaintextWithoutPolicyCheck(
    plain: string,
  ): Promise<Password> {
    const hash = await argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      parallelism: 4,
    });

    return new Password(hash);
  }
}
