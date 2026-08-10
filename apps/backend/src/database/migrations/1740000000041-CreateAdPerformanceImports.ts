import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdPerformanceImports1740000000041 implements MigrationInterface {
  name = 'CreateAdPerformanceImports1740000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ad_performance_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'unknown',
        source_format VARCHAR(50) NOT NULL DEFAULT 'generic',
        file_name VARCHAR(500) NOT NULL,
        period_start DATE,
        period_end DATE,
        row_count INT NOT NULL DEFAULT 0,
        totals JSONB NOT NULL DEFAULT '{}',
        rows JSONB NOT NULL DEFAULT '[]',
        imported_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ad_performance_imports_tenant_created
      ON ad_performance_imports(tenant_id, created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ad_performance_imports`);
  }
}
