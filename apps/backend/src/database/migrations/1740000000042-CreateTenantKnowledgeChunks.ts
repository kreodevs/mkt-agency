import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantKnowledgeChunks1740000000042 implements MigrationInterface {
  name = 'CreateTenantKnowledgeChunks1740000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        source_type VARCHAR(50) NOT NULL,
        source_id UUID,
        chunk_index INT NOT NULL DEFAULT 0,
        content TEXT NOT NULL,
        content_hash VARCHAR(64) NOT NULL,
        embedding JSONB,
        search_vector tsvector,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, source_type, source_id, chunk_index)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_knowledge_chunks_tenant
      ON tenant_knowledge_chunks(tenant_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_knowledge_chunks_search
      ON tenant_knowledge_chunks USING GIN(search_vector)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_knowledge_chunks`);
  }
}
