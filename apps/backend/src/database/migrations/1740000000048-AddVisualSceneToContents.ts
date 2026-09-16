import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualSceneToContents1740000000048 implements MigrationInterface {
  name = 'AddVisualSceneToContents1740000000048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS visual_scene VARCHAR(32)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS visual_scene
    `);
  }
}
