import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { TenantEntity } from '../../tenant/infrastructure/typeorm/tenant.entity';

export const SETTINGS_KEY_SOCIAL_WEBHOOK_SECRET = 'socialWebhookSecret';

@Injectable()
export class TenantWebhookService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {}

  async getOrCreateSecret(tenantId: string): Promise<{ secret: string; webhookPath: string }> {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException({ error: 'Tenant not found', code: 'NOT_FOUND' });
    }

    const settings = {
      ...(tenant.settings ?? {}),
      [SETTINGS_KEY_SOCIAL_WEBHOOK_SECRET]: '',
    };
    let secret = settings[SETTINGS_KEY_SOCIAL_WEBHOOK_SECRET];
    const existing = tenant.settings?.[SETTINGS_KEY_SOCIAL_WEBHOOK_SECRET];
    if (typeof existing === 'string' && existing.length >= 16) {
      secret = existing;
    } else {
      secret = randomBytes(24).toString('hex');
      settings[SETTINGS_KEY_SOCIAL_WEBHOOK_SECRET] = secret;
      await this.tenants.update(tenantId, { settings });
    }

    return {
      secret,
      webhookPath: `/api/v1/social-inbox/webhook/${tenantId}`,
    };
  }

  async validateSecret(tenantId: string, provided: string | undefined): Promise<void> {
    const { secret } = await this.getOrCreateSecret(tenantId);
    const a = createHash('sha256').update(secret).digest();
    const b = createHash('sha256').update(provided ?? '').digest();
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException({ error: 'Invalid webhook secret', code: 'UNAUTHORIZED' });
    }
  }
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
