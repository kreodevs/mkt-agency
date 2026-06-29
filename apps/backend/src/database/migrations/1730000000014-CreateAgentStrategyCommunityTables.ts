import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tablas de agentes IA, estrategia y community manager.
 * En dev se creaban vía synchronize; en prod faltaban y generaban
 * "relation does not exist" en dashboard y agentes.
 */
export class CreateAgentStrategyCommunityTables1730000000014
  implements MigrationInterface
{
  name = 'CreateAgentStrategyCommunityTables1730000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS strategy_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'analyzing',
        source VARCHAR(50) NOT NULL DEFAULT 'auto',
        brand_brief_id UUID,
        data JSONB NOT NULL DEFAULT '{}',
        suggestions JSONB NOT NULL DEFAULT '[]',
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_strategy_adjustments_tenant_created
      ON strategy_adjustments(tenant_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS community_manager_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        data JSONB NOT NULL DEFAULT '{}',
        posts JSONB NOT NULL DEFAULT '[]',
        published_posts JSONB NOT NULL DEFAULT '[]',
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_community_manager_batches_tenant_created
      ON community_manager_batches(tenant_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tone_presets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        tone_text TEXT NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'manual',
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tone_presets_tenant
      ON tone_presets(tenant_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_interviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        agent_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        current_step INTEGER NOT NULL DEFAULT 0,
        total_steps INTEGER NOT NULL DEFAULT 6,
        answers JSONB NOT NULL DEFAULT '{}',
        brand_brief JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_interviews_tenant_type_status
      ON agent_interviews(tenant_id, agent_type, status)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_interview_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        interview_id UUID NOT NULL REFERENCES agent_interviews(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_interview_messages_interview
      ON agent_interview_messages(interview_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_competitor_analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        competitors_input TEXT,
        analysis JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_competitor_analyses_tenant
      ON agent_competitor_analyses(tenant_id)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS agent_image_generations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        prompt VARCHAR(1000) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        image_url TEXT,
        asset_id UUID,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_image_generations_tenant
      ON agent_image_generations(tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS agent_image_generations`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_competitor_analyses`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_interview_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_interviews`);
    await queryRunner.query(`DROP TABLE IF EXISTS tone_presets`);
    await queryRunner.query(`DROP TABLE IF EXISTS community_manager_batches`);
    await queryRunner.query(`DROP TABLE IF EXISTS strategy_adjustments`);
  }
}
