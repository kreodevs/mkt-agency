import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlatformToContents1730000000029 implements MigrationInterface {
  name = 'AddPlatformToContents1730000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS platform VARCHAR(20) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS platform
    `);
  }
}
