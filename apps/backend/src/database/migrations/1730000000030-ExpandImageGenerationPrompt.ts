import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandImageGenerationPrompt1730000000030 implements MigrationInterface {
  name = 'ExpandImageGenerationPrompt1730000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      ALTER COLUMN prompt TYPE TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      ALTER COLUMN prompt TYPE VARCHAR(1000)
    `);
  }
}
