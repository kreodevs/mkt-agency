/**
 * Limpieza idempotente de contenidos generados y ciclo de competidores.
 * Misma lógica que migración 0032; útil cuando 0032 ya está en typeorm_migrations.
 *
 * Omitir: SKIP_GENERATED_CONTENT_RESET=true
 */
import dataSource from './data-source';

const TRUNCATE_TABLES = [
  'content_approvals',
  'content_versions',
  'contents',
  'community_manager_batches',
  'agent_image_generations',
  'agent_competitor_analyses',
  'competitor_mentions',
  'competitors',
];

async function tableExists(tableName: string): Promise<boolean> {
  const rows: Array<{ exists: boolean }> = await dataSource.query(
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

async function main(): Promise<void> {
  if (process.env.SKIP_GENERATED_CONTENT_RESET === 'true') {
    console.warn(
      '[clear-generated-contents] SKIP_GENERATED_CONTENT_RESET=true — no se borraron contenidos ni análisis',
    );
    return;
  }

  await dataSource.initialize();

  try {
    if (await tableExists('agent_image_generations')) {
      await dataSource.query(`
        DELETE FROM assets
        WHERE id IN (
          SELECT asset_id
          FROM agent_image_generations
          WHERE asset_id IS NOT NULL
        )
      `);
    }

    if (await tableExists('agency_notifications')) {
      await dataSource.query(`
        DELETE FROM agency_notifications
        WHERE type IN ('week_ready', 'approval_reminder')
      `);
    }

    if (await tableExists('events')) {
      await dataSource.query(`
        DELETE FROM events
        WHERE aggregate_type = 'content'
      `);
    }

    const existing: string[] = [];
    for (const table of TRUNCATE_TABLES) {
      if (await tableExists(table)) {
        existing.push(table);
      }
    }

    if (existing.length === 0) {
      console.warn('[clear-generated-contents] No target tables found — skipping truncate');
      return;
    }

    const quoted = existing.map((table) => `"${table}"`).join(', ');
    await dataSource.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);

    console.warn(
      `[clear-generated-contents] Cleared ${existing.length} table(s). Tenants, products and SEO keywords preserved.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('[clear-generated-contents] Failed:', error);
  process.exit(1);
});
