import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCreativePacksAndMediaIntents1730000000039
  implements MigrationInterface
{
  name = 'CreateCreativePacksAndMediaIntents1730000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS creative_packs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES agent_plans(id) ON DELETE SET NULL,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'ready',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_creative_packs_tenant_plan
      ON creative_packs(tenant_id, plan_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS media_campaign_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        plan_id UUID REFERENCES agent_plans(id) ON DELETE SET NULL,
        creative_pack_id UUID REFERENCES creative_packs(id) ON DELETE SET NULL,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL,
        name VARCHAR(500) NOT NULL,
        structure JSONB NOT NULL DEFAULT '{}',
        daily_budget DECIMAL(12,2),
        total_budget DECIMAL(12,2),
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
        approved_at TIMESTAMPTZ,
        approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
        launched_at TIMESTAMPTZ,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_media_intents_tenant_status
      ON media_campaign_intents(tenant_id, status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS media_campaign_intents`);
    await queryRunner.query(`DROP TABLE IF EXISTS creative_packs`);
  }
}
