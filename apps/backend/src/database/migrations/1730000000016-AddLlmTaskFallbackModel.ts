import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLlmTaskFallbackModel1730000000016 implements MigrationInterface {
  name = 'AddLlmTaskFallbackModel1730000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE llm_task_configs
      ADD COLUMN IF NOT EXISTS fallback_model VARCHAR(255)
    `);

    await queryRunner.query(`
      UPDATE llm_task_configs
      SET fallback_model = regexp_replace(model, ':free$', '')
      WHERE model LIKE '%:free'
        AND (fallback_model IS NULL OR fallback_model = '')
        AND regexp_replace(model, ':free$', '') <> model
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE llm_task_configs DROP COLUMN IF EXISTS fallback_model
    `);
  }
}
