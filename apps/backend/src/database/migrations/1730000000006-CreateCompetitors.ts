import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompetitors1730000000006 implements MigrationInterface {
  name = 'CreateCompetitors1730000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS competitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        website VARCHAR(500),
        industry VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS competitor_mentions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
        source VARCHAR(255),
        content TEXT,
        sentiment VARCHAR(50),
        mentioned_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS competitor_mentions`);
    await queryRunner.query(`DROP TABLE IF EXISTS competitors`);
  }
}
