import { MigrationInterface, QueryRunner } from 'typeorm';

/** Superadmins are platform-scoped; legacy rows may still carry orphan tenant_id. */
export class ClearSuperadminTenantId1730000000008 implements MigrationInterface {
  name = 'ClearSuperadminTenantId1730000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET tenant_id = NULL
      WHERE is_superadmin = TRUE AND tenant_id IS NOT NULL
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible without backup of previous tenant_id values.
  }
}
