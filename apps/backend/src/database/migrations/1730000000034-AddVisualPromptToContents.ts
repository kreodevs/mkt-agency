import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualPromptToContents1730000000034 implements MigrationInterface {
  name = 'AddVisualPromptToContents1730000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS visual_prompt TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS visual_prompt
    `);
  }
}
