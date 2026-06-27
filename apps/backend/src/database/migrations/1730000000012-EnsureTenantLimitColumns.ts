import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Legacy deployments kept an old `tenants` table (CREATE TABLE IF NOT EXISTS skipped baseline).
 * CreateTenantHandler expects limit/package columns that may never have been added.
 */
export class EnsureTenantLimitColumns1730000000012 implements MigrationInterface {
  name = 'EnsureTenantLimitColumns1730000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 5
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS max_assets_size BIGINT NOT NULL DEFAULT 1073741824
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS max_file_size BIGINT NOT NULL DEFAULT 10485760
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'packages'
        ) THEN
          ALTER TABLE tenants
          ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages(id) ON DELETE SET NULL;
        ELSE
          ALTER TABLE tenants
          ADD COLUMN IF NOT EXISTS package_id UUID;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'company_profiles'
        ) THEN
          ALTER TABLE company_profiles
          ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending';

          ALTER TABLE company_profiles
          ADD COLUMN IF NOT EXISTS completion_percentage INTEGER NOT NULL DEFAULT 0;

          ALTER TABLE company_profiles
          ADD COLUMN IF NOT EXISTS objectives JSONB NOT NULL DEFAULT '[]';

          ALTER TABLE company_profiles
          ADD COLUMN IF NOT EXISTS visual_preferences JSONB NOT NULL DEFAULT '{}';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'company_profile_sections'
        ) THEN
          ALTER TABLE company_profile_sections
          ADD COLUMN IF NOT EXISTS is_completed BOOLEAN NOT NULL DEFAULT FALSE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE company_profile_sections DROP COLUMN IF EXISTS is_completed
    `);
    await queryRunner.query(`
      ALTER TABLE company_profiles DROP COLUMN IF EXISTS visual_preferences
    `);
    await queryRunner.query(`
      ALTER TABLE company_profiles DROP COLUMN IF EXISTS objectives
    `);
    await queryRunner.query(`
      ALTER TABLE company_profiles DROP COLUMN IF EXISTS completion_percentage
    `);
    await queryRunner.query(`
      ALTER TABLE company_profiles DROP COLUMN IF EXISTS status
    `);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS package_id`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS max_file_size`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS max_assets_size`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS max_users`);
  }
}
