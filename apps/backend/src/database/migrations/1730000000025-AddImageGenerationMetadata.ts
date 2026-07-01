import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageGenerationMetadata1730000000025 implements MigrationInterface {
  name = 'AddImageGenerationMetadata1730000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      DROP COLUMN IF EXISTS metadata
    `);
  }
}
