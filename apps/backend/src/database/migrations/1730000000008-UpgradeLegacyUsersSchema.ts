import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Upgrades users table from legacy Nest stack (synchronize + camelCase columns)
 * to monorepo schema (snake_case). Safe when table already matches target schema.
 */
export class UpgradeLegacyUsersSchema1730000000008 implements MigrationInterface {
  name = 'UpgradeLegacyUsersSchema1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'owner';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'password' AND a.attnum > 0 AND NOT a.attisdropped
        ) AND EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'password_hash' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users SET password_hash = password
          WHERE password_hash IS NULL OR password_hash = '';
        ELSIF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'password' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          ALTER TABLE users RENAME COLUMN password TO password_hash;
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'isSuperAdmin' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users SET is_superadmin = "isSuperAdmin";
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'isActive' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users SET status = CASE WHEN "isActive" THEN 'active' ELSE 'inactive' END;
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'createdAt' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users SET created_at = "createdAt" WHERE created_at IS NULL;
        END IF;

        IF EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'users'
            AND a.attname = 'updatedAt' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users SET updated_at = "updatedAt" WHERE updated_at IS NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'tenant_users'
        ) AND EXISTS (
          SELECT 1 FROM pg_attribute a
          JOIN pg_class c ON a.attrelid = c.oid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'tenant_users'
            AND a.attname = 'tenantId' AND a.attnum > 0 AND NOT a.attisdropped
        ) THEN
          UPDATE users u
          SET tenant_id = tu."tenantId"
          FROM tenant_users tu
          WHERE tu."userId" = u.id AND u.tenant_id IS NULL;
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'tenant_users'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'tenant_users'
            AND column_name = 'tenant_id'
        ) THEN
          UPDATE users u
          SET tenant_id = tu.tenant_id
          FROM tenant_users tu
          WHERE tu.user_id = u.id AND u.tenant_id IS NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant`);
  }
}
