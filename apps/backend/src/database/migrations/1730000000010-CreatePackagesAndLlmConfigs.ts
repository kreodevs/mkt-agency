import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePackagesAndLlmConfigs1730000000010 implements MigrationInterface {
  name = 'CreatePackagesAndLlmConfigs1730000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        max_users INTEGER NOT NULL DEFAULT 5,
        max_assets_size BIGINT NOT NULL DEFAULT 1073741824,
        max_file_size BIGINT NOT NULL DEFAULT 10485760,
        max_campaigns INTEGER,
        max_ai_requests_per_day INTEGER,
        features JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS max_file_size BIGINT NOT NULL DEFAULT 10485760
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS llm_task_configs (
        task_type VARCHAR(100) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        description TEXT,
        provider VARCHAR(50) NOT NULL DEFAULT 'openrouter',
        model VARCHAR(255) NOT NULL,
        temperature NUMERIC(4, 2) NOT NULL DEFAULT 0.70,
        max_tokens INTEGER,
        system_prompt_template TEXT,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      INSERT INTO packages (slug, name, description, max_users, max_assets_size, max_file_size, max_campaigns, max_ai_requests_per_day, sort_order)
      VALUES
        ('starter', 'Starter', 'Plan inicial para equipos pequeños', 5, 1073741824, 10485760, 3, 50, 1),
        ('professional', 'Professional', 'Plan intermedio con más capacidad', 25, 5368709120, 52428800, 15, 200, 2),
        ('enterprise', 'Enterprise', 'Plan avanzado sin límites estrictos', 100, 53687091200, 104857600, NULL, 1000, 3)
      ON CONFLICT (slug) DO NOTHING
    `);

    await queryRunner.query(`
      UPDATE tenants t
      SET package_id = p.id
      FROM packages p
      WHERE t.package_id IS NULL AND t.plan = p.slug
    `);

    await queryRunner.query(`
      UPDATE tenants t
      SET
        max_users = p.max_users,
        max_assets_size = p.max_assets_size,
        max_file_size = p.max_file_size
      FROM packages p
      WHERE t.package_id = p.id
    `);

    await queryRunner.query(`
      INSERT INTO llm_task_configs (task_type, label, description, model, temperature)
      VALUES
        ('section_suggestion', 'Sugerencias de perfil', 'Completa secciones del perfil de empresa', 'deepseek/deepseek-v4-flash', 0.70),
        ('campaign_strategy', 'Estrategia de campaña', 'Genera estrategia y presupuestos de campaña', 'deepseek/deepseek-v4-flash', 0.70),
        ('lead_scoring', 'Scoring de leads', 'Puntúa leads del CRM', 'deepseek/deepseek-v4-flash', 0.50),
        ('proposal_generation', 'Generación de propuestas', 'Redacta propuestas comerciales', 'deepseek/deepseek-v4-flash', 0.70),
        ('report_generation', 'Generación de reportes', 'Genera informes de marketing', 'deepseek/deepseek-v4-flash', 0.70)
      ON CONFLICT (task_type) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS llm_task_configs`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS max_file_size`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS package_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS packages`);
  }
}
