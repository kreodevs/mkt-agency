import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisualTemplateFieldsToContents1740000000044 implements MigrationInterface {
  name = 'AddVisualTemplateFieldsToContents1740000000044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS visual_template_id VARCHAR(40),
      ADD COLUMN IF NOT EXISTS visual_headline VARCHAR(200),
      ADD COLUMN IF NOT EXISTS visual_subline VARCHAR(300),
      ADD COLUMN IF NOT EXISTS visual_cta VARCHAR(80)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS visual_template_id,
      DROP COLUMN IF EXISTS visual_headline,
      DROP COLUMN IF EXISTS visual_subline,
      DROP COLUMN IF EXISTS visual_cta
    `);
  }
}
