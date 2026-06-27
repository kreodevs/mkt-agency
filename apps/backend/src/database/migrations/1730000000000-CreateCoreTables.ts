import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1730000000000 implements MigrationInterface {
  name = 'CreateCoreTables1730000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        plan VARCHAR(50) NOT NULL DEFAULT 'starter',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        settings JSONB NOT NULL DEFAULT '{}',
        max_users INTEGER NOT NULL DEFAULT 5,
        max_assets_size BIGINT NOT NULL DEFAULT 1073741824,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
        role VARCHAR(50) NOT NULL DEFAULT 'owner',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        last_login_at TIMESTAMPTZ,
        login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255) NOT NULL,
        previous_refresh_token_hash VARCHAR(255),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'user_id'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'security_events' AND column_name = 'severity'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_security_events_severity
          ON security_events(severity, created_at DESC);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS impersonation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        superadmin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        action VARCHAR(255) NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
        company_name VARCHAR(255),
        industry VARCHAR(255),
        website VARCHAR(500),
        brand_voice TEXT,
        target_audience_desc TEXT,
        competitors TEXT,
        objectives JSONB NOT NULL DEFAULT '[]',
        visual_preferences JSONB NOT NULL DEFAULT '{}',
        completion_percentage INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_profile_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        section_key VARCHAR(100) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS section_suggestion_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        profile_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
        section_key VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        result JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS outbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aggregate_type VARCHAR(100) NOT NULL,
        aggregate_id UUID NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS campaign_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        objective VARCHAR(255),
        platforms JSONB NOT NULL DEFAULT '[]',
        budget_distribution JSONB NOT NULL DEFAULT '{}',
        agent_config JSONB NOT NULL DEFAULT '{}',
        is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        template_id UUID REFERENCES campaign_templates(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        objective VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        total_budget DECIMAL(12,2),
        platforms JSONB NOT NULL DEFAULT '[]',
        strategy JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'tenant_id'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        platform VARCHAR(100) NOT NULL,
        daily_budget DECIMAL(10,2) NOT NULL,
        total_budget DECIMAL(12,2) NOT NULL,
        proposed_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
        approved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audiences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        criteria JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS campaign_strategy_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        result JSONB,
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        title VARCHAR(500) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        scheduled_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        title VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        assets JSONB NOT NULL DEFAULT '[]',
        reason VARCHAR(500),
        change_summary TEXT,
        signature_hash VARCHAR(128),
        signed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(content_id, version_number)
      )
    `);

    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS current_version_id UUID
      REFERENCES content_versions(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS content_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
        approved_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        signature_hash VARCHAR(128) NOT NULL,
        status VARCHAR(50) NOT NULL,
        feedback TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        aggregate_type VARCHAR(100) NOT NULL,
        aggregate_id UUID NOT NULL,
        version INTEGER NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(aggregate_type, aggregate_id, version)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS events`);
    await queryRunner.query(`DROP TABLE IF EXISTS content_approvals`);
    await queryRunner.query(`ALTER TABLE IF EXISTS contents DROP COLUMN IF EXISTS current_version_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS content_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS contents`);
    await queryRunner.query(`DROP TABLE IF EXISTS campaign_strategy_assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS audiences`);
    await queryRunner.query(`DROP TABLE IF EXISTS budgets`);
    await queryRunner.query(`DROP TABLE IF EXISTS campaigns`);
    await queryRunner.query(`DROP TABLE IF EXISTS campaign_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS outbox`);
    await queryRunner.query(`DROP TABLE IF EXISTS section_suggestion_assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_profile_sections`);
    await queryRunner.query(`DROP TABLE IF EXISTS company_profiles`);
    await queryRunner.query(`DROP TABLE IF EXISTS impersonation_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS security_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenants`);
  }
}
