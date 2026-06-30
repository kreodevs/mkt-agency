import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandBriefMarkdown1730000000017 implements MigrationInterface {
  name = 'AddBrandBriefMarkdown1730000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_interviews
      ADD COLUMN IF NOT EXISTS brand_brief_markdown TEXT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_interviews
      DROP COLUMN IF EXISTS brand_brief_markdown
    `);
  }
}
