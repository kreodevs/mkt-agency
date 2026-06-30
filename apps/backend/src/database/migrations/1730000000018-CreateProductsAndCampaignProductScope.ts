import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndCampaignProductScope1730000000018
  implements MigrationInterface
{
  name = 'CreateProductsAndCampaignProductScope1730000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Legacy/synchronize may have created `products` without tenant scope.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'products'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'products'
            AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE products RENAME TO products_legacy;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price_range VARCHAR(100),
        target_audience TEXT,
        value_proposition TEXT,
        keywords JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, slug)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id)
    `);

    await queryRunner.query(`
      ALTER TABLE campaigns
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS scope VARCHAR(20) NOT NULL DEFAULT 'product'
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_campaigns_scope'
        ) THEN
          ALTER TABLE campaigns
            ADD CONSTRAINT chk_campaigns_scope CHECK (scope IN ('product', 'brand'));
        END IF;
      END $$
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_product ON campaigns(product_id)
    `);

    await queryRunner.query(`
      INSERT INTO products (tenant_id, name, slug, description, target_audience, value_proposition, status, is_primary)
      SELECT DISTINCT
        t.id,
        COALESCE(NULLIF(TRIM(cp.company_name), ''), 'Mi producto principal'),
        'principal',
        cp.brand_voice,
        cp.target_audience_desc,
        cp.brand_voice,
        'active',
        TRUE
      FROM tenants t
      LEFT JOIN company_profiles cp ON cp.tenant_id = t.id
      WHERE NOT EXISTS (
        SELECT 1 FROM products p WHERE p.tenant_id = t.id
      )
      AND (
        EXISTS (SELECT 1 FROM campaigns c WHERE c.tenant_id = t.id)
        OR cp.id IS NOT NULL
      )
    `);

    await queryRunner.query(`
      UPDATE campaigns c
      SET product_id = p.id,
          scope = 'product'
      FROM products p
      WHERE c.tenant_id = p.tenant_id
        AND c.product_id IS NULL
        AND p.is_primary = TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_campaigns_product`);
    await queryRunner.query(`
      ALTER TABLE campaigns
        DROP CONSTRAINT IF EXISTS chk_campaigns_scope,
        DROP COLUMN IF EXISTS product_id,
        DROP COLUMN IF EXISTS scope
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_products_tenant`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
  }
}
