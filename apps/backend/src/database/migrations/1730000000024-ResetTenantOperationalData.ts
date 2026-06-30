import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-shot: borra datos operativos de tenants para pruebas desde cero.
 *
 * CONSERVA: tenants, users, sessions, packages, llm_providers, llm_task_configs,
 *           tenant_platform_admins
 *
 * BORRA: onboarding, productos, campañas, contenido, agentes, CRM, assets,
 *        reportes, propuestas, competidores, notificaciones, audit/security logs, etc.
 *
 * Omitir en deploy: SKIP_OPERATIONAL_DATA_RESET=true
 */
export class ResetTenantOperationalData1730000000024 implements MigrationInterface {
  name = 'ResetTenantOperationalData1730000000024';

  /** Tablas operativas en orden seguro (hijos antes que padres cuando no hay TRUNCATE conjunto). */
  private readonly operationalTables = [
    'agency_notifications',
    'agent_interview_messages',
    'agent_interviews',
    'agent_competitor_analyses',
    'agent_image_generations',
    'community_manager_batches',
    'tone_presets',
    'strategy_adjustments',
    'content_approvals',
    'events',
    'content_versions',
    'contents',
    'campaign_strategy_assignments',
    'audiences',
    'budgets',
    'campaigns',
    'campaign_templates',
    'section_suggestion_assignments',
    'company_profile_sections',
    'company_profiles',
    'outbox',
    'form_submissions',
    'lead_interactions',
    'leads',
    'forms',
    'asset_tag_assignments',
    'assets',
    'asset_tags',
    'asset_folders',
    'dns_verifications',
    'custom_domains',
    'proposals',
    'reports',
    'competitor_mentions',
    'competitors',
    'products',
    'audit_logs',
    'security_events',
    'impersonation_logs',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.SKIP_OPERATIONAL_DATA_RESET === 'true') {
      console.warn(
        '[ResetTenantOperationalData] SKIP_OPERATIONAL_DATA_RESET=true — no se borraron datos operativos',
      );
      return;
    }

    const rows: Array<{ tablename: string }> = await queryRunner.query(
      `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
      `,
      [this.operationalTables],
    );

    const existing = rows.map((r) => r.tablename);
    if (existing.length === 0) {
      console.warn('[ResetTenantOperationalData] No operational tables found — skipping');
      return;
    }

    const quoted = existing.map((t) => `"${t}"`).join(', ');

    await queryRunner.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    // Legacy table from pre-product catalog (migration 0018)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'products_legacy'
        ) THEN
          TRUNCATE TABLE products_legacy RESTART IDENTITY CASCADE;
        END IF;
      END $$;
    `);

    console.warn(
      `[ResetTenantOperationalData] Truncated ${existing.length} operational table(s). Users and tenants preserved.`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible — datos operativos eliminados a propósito.
  }
}
