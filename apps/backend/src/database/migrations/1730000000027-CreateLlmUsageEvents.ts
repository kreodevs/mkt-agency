import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLlmUsageEvents1730000000027 implements MigrationInterface {
  name = 'CreateLlmUsageEvents1730000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS llm_usage_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NULL REFERENCES tenants(id) ON DELETE SET NULL,
        user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
        task_type VARCHAR(100) NOT NULL,
        provider_id UUID NULL REFERENCES llm_providers(id) ON DELETE SET NULL,
        model VARCHAR(255) NOT NULL,
        modality VARCHAR(20) NOT NULL DEFAULT 'chat',
        prompt_tokens INT NOT NULL DEFAULT 0,
        completion_tokens INT NOT NULL DEFAULT 0,
        total_tokens INT NOT NULL DEFAULT 0,
        estimated_cost_usd NUMERIC(14, 6) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_usage_events_tenant_created
      ON llm_usage_events (tenant_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_llm_usage_events_created
      ON llm_usage_events (created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS llm_usage_events`);
  }
}
