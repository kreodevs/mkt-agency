import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLlmProviders1730000000011 implements MigrationInterface {
  name = 'CreateLlmProviders1730000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS llm_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        api_url VARCHAR(500) NOT NULL,
        api_key TEXT,
        default_model VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO llm_providers (slug, name, api_url, default_model, sort_order)
      VALUES ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1', 'deepseek/deepseek-v4-flash', 1)
      ON CONFLICT (slug) DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE llm_task_configs
      ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES llm_providers(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      UPDATE llm_task_configs t
      SET provider_id = p.id
      FROM llm_providers p
      WHERE t.provider_id IS NULL AND p.slug = 'openrouter'
    `);

    await queryRunner.query(`
      ALTER TABLE llm_task_configs DROP COLUMN IF EXISTS provider
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE llm_task_configs
      ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NOT NULL DEFAULT 'openrouter'
    `);
    await queryRunner.query(`
      ALTER TABLE llm_task_configs DROP COLUMN IF EXISTS provider_id
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS llm_providers`);
  }
}
