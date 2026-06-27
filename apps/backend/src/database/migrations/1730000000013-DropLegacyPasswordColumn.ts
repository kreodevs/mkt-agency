import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the legacy `password` column from the `users` table.
 *
 * The old schema had a `password` column (NOT NULL) that stored hashes directly.
 * The migration to `password_hash` added the new column but never removed the old one.
 * When creating users via TypeORM (which only writes `password_hash`), the old
 * `password` column remains NULL, violating its NOT NULL constraint.
 */
export class DropLegacyPasswordColumn1730000000013 implements MigrationInterface {
  name = 'DropLegacyPasswordColumn1730000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'password'
        ) THEN
          ALTER TABLE users DROP COLUMN password;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the column if ever needed (no data recovery possible)
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN password VARCHAR(255);
    `);
  }
}