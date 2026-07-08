import { MigrationInterface, QueryRunner } from 'typeorm';

/** Corrige slugs legacy flux-2-* → flux.2-* exigidos por OpenRouter Image API. */
export class FixFluxImageModelSlugs1730000000036 implements MigrationInterface {
  name = 'FixFluxImageModelSlugs1730000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE llm_task_configs
      SET model = 'black-forest-labs/flux.2-pro'
      WHERE model = 'black-forest-labs/flux-2-pro'
    `);

    await queryRunner.query(`
      UPDATE llm_task_configs
      SET fallback_model = 'black-forest-labs/flux.2-pro'
      WHERE fallback_model = 'black-forest-labs/flux-2-pro'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE llm_task_configs
      SET model = 'black-forest-labs/flux-2-pro'
      WHERE model = 'black-forest-labs/flux.2-pro'
        AND task_type IN ('image_generation', 'cm_portrait_generation')
    `);

    await queryRunner.query(`
      UPDATE llm_task_configs
      SET fallback_model = 'black-forest-labs/flux-2-pro'
      WHERE fallback_model = 'black-forest-labs/flux.2-pro'
    `);
  }
}
