import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdToContents1730000000019 implements MigrationInterface {
  name = 'AddProductIdToContents1730000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contents_product ON contents(product_id)
    `);

    await queryRunner.query(`
      UPDATE contents c
      SET product_id = camp.product_id
      FROM campaigns camp
      WHERE c.campaign_id = camp.id
        AND c.product_id IS NULL
        AND camp.product_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contents_product`);
    await queryRunner.query(`
      ALTER TABLE contents DROP COLUMN IF EXISTS product_id
    `);
  }
}
