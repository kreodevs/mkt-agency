import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialInteractions1730000000038 implements MigrationInterface {
  name = 'CreateSocialInteractions1730000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS social_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'manual',
        channel VARCHAR(50) NOT NULL DEFAULT 'comment',
        external_id VARCHAR(255),
        author_handle VARCHAR(255),
        message TEXT NOT NULL,
        intent VARCHAR(50) NOT NULL DEFAULT 'pending',
        sentiment VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'open',
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        suggested_reply TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_social_interactions_tenant_status
      ON social_interactions(tenant_id, status, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS social_interactions`);
  }
}
