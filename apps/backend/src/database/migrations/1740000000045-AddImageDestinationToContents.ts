import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageDestinationToContents1740000000045 implements MigrationInterface {
  name = 'AddImageDestinationToContents1740000000045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS image_destination VARCHAR(10) NOT NULL DEFAULT 'feed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS image_destination
    `);
  }
}
