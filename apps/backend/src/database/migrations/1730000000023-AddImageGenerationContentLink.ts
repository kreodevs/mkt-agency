import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageGenerationContentLink1730000000023 implements MigrationInterface {
  name = 'AddImageGenerationContentLink1730000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES contents(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_image_generations_content
      ON agent_image_generations (content_id)
      WHERE content_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE agent_image_generations
      DROP COLUMN IF EXISTS content_id,
      DROP COLUMN IF EXISTS product_id
    `);
  }
}
