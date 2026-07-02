import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformIntegrations1730000000028 implements MigrationInterface {
  name = 'CreatePlatformIntegrations1730000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS platform_integrations (
        slug VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        api_key TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        settings JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO platform_integrations (slug, name)
      VALUES ('tavily', 'Tavily Search')
      ON CONFLICT (slug) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS platform_integrations`);
  }
}
