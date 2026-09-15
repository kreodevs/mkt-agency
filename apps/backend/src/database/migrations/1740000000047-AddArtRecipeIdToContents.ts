import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArtRecipeIdToContents1740000000047 implements MigrationInterface {
  name = 'AddArtRecipeIdToContents1740000000047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS art_recipe_id VARCHAR(80)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS art_recipe_id
    `);
  }
}
