import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentPublishedFields1740000000040 implements MigrationInterface {
  name = 'AddContentPublishedFields1740000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS external_post_id VARCHAR(500) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contents_tenant_published_at
      ON contents(tenant_id, published_at)
      WHERE published_at IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_contents_tenant_published_at`);
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS external_post_id,
      DROP COLUMN IF EXISTS published_at
    `);
  }
}
