import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-shot: elimina contenido generado y análisis de competidores para empezar de cero
 * sin perder la configuración base del tenant.
 *
 * CONSERVA: tenants, users, sessions, products (incl. keywords/tags SEO), company_profiles,
 *           campaigns, agent_interviews, strategy_adjustments, tone_presets, CRM, assets no
 *           ligados a generaciones IA de contenido, LLM config, etc.
 *
 * BORRA: contents, content_versions, content_approvals, events (aggregate content),
 *        community_manager_batches, agent_image_generations, agent_competitor_analyses,
 *        competitors, competitor_mentions, assets de generaciones IA,
 *        notificaciones week_ready/approval_reminder.
 *
 * Omitir en deploy: SKIP_GENERATED_CONTENT_RESET=true
 */
export class ClearGeneratedContentsAndCompetitorAnalyses1730000000032
  implements MigrationInterface
{
  name = 'ClearGeneratedContentsAndCompetitorAnalyses1730000000032';

  private readonly truncateTables = [
    'content_approvals',
    'content_versions',
    'contents',
    'community_manager_batches',
    'agent_image_generations',
    'agent_competitor_analyses',
    'competitor_mentions',
    'competitors',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.SKIP_GENERATED_CONTENT_RESET === 'true') {
      console.warn(
        '[ClearGeneratedContentsAndCompetitorAnalyses] SKIP_GENERATED_CONTENT_RESET=true — no se borraron contenidos ni análisis',
      );
      return;
    }

    const hasImageGenerations = await this.tableExists(queryRunner, 'agent_image_generations');
    if (hasImageGenerations) {
      await queryRunner.query(`
        DELETE FROM assets
        WHERE id IN (
          SELECT asset_id
          FROM agent_image_generations
          WHERE asset_id IS NOT NULL
        )
      `);
    }

    if (await this.tableExists(queryRunner, 'agency_notifications')) {
      await queryRunner.query(`
        DELETE FROM agency_notifications
        WHERE type IN ('week_ready', 'approval_reminder')
      `);
    }

    if (await this.tableExists(queryRunner, 'events')) {
      await queryRunner.query(`
        DELETE FROM events
        WHERE aggregate_type = 'content'
      `);
    }

    const rows: Array<{ tablename: string }> = await queryRunner.query(
      `
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
      `,
      [this.truncateTables],
    );

    const existing = rows.map((row) => row.tablename);
    if (existing.length === 0) {
      console.warn(
        '[ClearGeneratedContentsAndCompetitorAnalyses] No target tables found — skipping truncate',
      );
      return;
    }

    const quoted = existing.map((table) => `"${table}"`).join(', ');
    await queryRunner.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    console.warn(
      `[ClearGeneratedContentsAndCompetitorAnalyses] Cleared ${existing.length} table(s). Tenants, products and SEO keywords preserved; competitor cycle reset.`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible — contenidos y análisis eliminados a propósito.
  }

  private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const rows: Array<{ exists: boolean }> = await queryRunner.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = $1
        ) AS exists
      `,
      [tableName],
    );

    return rows[0]?.exists === true;
  }
}
