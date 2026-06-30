import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgencyNotifications1730000000022 implements MigrationInterface {
  name = 'CreateAgencyNotifications1730000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agency_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_notifications_tenant_unread
      ON agency_notifications (tenant_id, read_at, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agency_notifications_dedup
      ON agency_notifications (tenant_id, type, ((metadata->>'dedupKey')))
      WHERE metadata->>'dedupKey' IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS agency_notifications`);
  }
}
