import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualFormatToContents1730000000031 implements MigrationInterface {
  name = 'AddVisualFormatToContents1730000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS visual_format VARCHAR(20) NOT NULL DEFAULT 'image'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS visual_format
    `);
  }
}
