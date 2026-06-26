import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReports1730000000005 implements MigrationInterface {
  name = 'CreateReports1730000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        config JSONB DEFAULT '{}',
        data JSONB DEFAULT '{}',
        generated_by UUID REFERENCES users(id),
        status VARCHAR(50) NOT NULL DEFAULT 'generating',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reports`);
  }
}
