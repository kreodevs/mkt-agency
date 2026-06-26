import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAssets1730000000002 implements MigrationInterface {
  name = 'CreateAssets1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        parent_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100),
        file_key VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        url VARCHAR(1000),
        metadata JSONB DEFAULT '{}',
        reference_count INTEGER NOT NULL DEFAULT 0,
        is_in_use BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS asset_tag_assignments (
        asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        tag_id UUID NOT NULL REFERENCES asset_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (asset_id, tag_id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS asset_tag_assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS assets`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset_tags`);
    await queryRunner.query(`DROP TABLE IF EXISTS asset_folders`);
  }
}
