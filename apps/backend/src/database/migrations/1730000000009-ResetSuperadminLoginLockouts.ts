import { MigrationInterface, QueryRunner } from 'typeorm';

/** Reset lockouts caused by failed legacy hash verification during migration. */
export class ResetSuperadminLoginLockouts1730000000009 implements MigrationInterface {
  name = 'ResetSuperadminLoginLockouts1730000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE users
      SET login_attempts = 0, locked_until = NULL
      WHERE is_superadmin = TRUE
        AND (login_attempts > 0 OR locked_until IS NOT NULL)
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible.
  }
}
