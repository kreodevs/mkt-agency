import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdToCompetitorsAndCampaigns1730000000019 implements MigrationInterface {
  name = 'AddProductIdToCompetitorsAndCampaigns1730000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE competitors
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_competitors_product_id ON competitors(product_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_product_id ON campaigns(product_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_campaigns_product_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_competitors_product_id`);
    await queryRunner.query(`ALTER TABLE campaigns DROP COLUMN IF EXISTS product_id`);
    await queryRunner.query(`ALTER TABLE competitors DROP COLUMN IF EXISTS product_id`);
  }
}