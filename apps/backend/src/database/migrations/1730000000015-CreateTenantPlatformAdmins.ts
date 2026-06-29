import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Superadmins asignados como admin de plataforma de un tenant (sin tenant_id en users).
 * Permite impersonación cuando el tenant no tiene owner/admin activo.
 */
export class CreateTenantPlatformAdmins1730000000015 implements MigrationInterface {
  name = 'CreateTenantPlatformAdmins1730000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_platform_admins (
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (tenant_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_platform_admins_user
      ON tenant_platform_admins(user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_platform_admins`);
  }
}
