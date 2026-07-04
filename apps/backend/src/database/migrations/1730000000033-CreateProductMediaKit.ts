import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductMediaKit1730000000033 implements MigrationInterface {
  name = 'CreateProductMediaKit1730000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS product_media_kit_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        role VARCHAR(40) NOT NULL DEFAULT 'other',
        label VARCHAR(255),
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (product_id, asset_id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_product_media_kit_tenant_product
      ON product_media_kit_items (tenant_id, product_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_media_kit_items`);
  }
}
