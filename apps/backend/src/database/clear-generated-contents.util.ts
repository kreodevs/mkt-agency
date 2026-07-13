/**
 * Limpieza idempotente de contenidos generados (incluye aprobados y multi-versión).
 * Sin filtro por status ni signature_hash — TRUNCATE/DELETE borra todo el pipeline editorial.
 */

export const CLEAR_GENERATED_CONTENTS_TABLES = [
  'content_approvals',
  'content_versions',
  'contents',
  'community_manager_batches',
  'agent_image_generations',
  'agent_competitor_analyses',
  'competitor_mentions',
  'competitors',
] as const;

export interface SqlExecutor {
  query: (sql: string, parameters?: unknown[]) => Promise<unknown>;
}

export interface ClearGeneratedContentsCounts {
  contents: number;
  approvedContents: number;
  multiVersionContents: number;
  contentVersions: number;
  signedVersions: number;
}

export interface ClearGeneratedContentsResult {
  clearedTables: string[];
  before: ClearGeneratedContentsCounts;
  after: ClearGeneratedContentsCounts;
}

async function tableExists(executor: SqlExecutor, tableName: string): Promise<boolean> {
  const rows = (await executor.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  )) as Array<{ exists: boolean }>;

  return rows[0]?.exists === true;
}

async function readCounts(executor: SqlExecutor): Promise<ClearGeneratedContentsCounts> {
  const hasContents = await tableExists(executor, 'contents');
  const hasVersions = await tableExists(executor, 'content_versions');

  if (!hasContents) {
    return {
      contents: 0,
      approvedContents: 0,
      multiVersionContents: 0,
      contentVersions: 0,
      signedVersions: 0,
    };
  }

  const contentRows = (await executor.query(`
    SELECT
      COUNT(*)::int AS contents,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_contents
    FROM contents
  `)) as Array<{ contents: number; approved_contents: number }>;

  let multiVersionContents = 0;
  let contentVersions = 0;
  let signedVersions = 0;

  if (hasVersions) {
    const versionStats = (await executor.query(`
      SELECT
        (SELECT COUNT(*)::int FROM content_versions) AS content_versions,
        (SELECT COUNT(*)::int FROM content_versions WHERE signature_hash IS NOT NULL) AS signed_versions,
        (SELECT COUNT(*)::int FROM (
          SELECT content_id FROM content_versions GROUP BY content_id HAVING COUNT(*) > 1
        ) multi) AS multi_version_contents
    `)) as Array<{
      content_versions: number;
      signed_versions: number;
      multi_version_contents: number;
    }>;

    const stats = versionStats[0];
    contentVersions = stats?.content_versions ?? 0;
    signedVersions = stats?.signed_versions ?? 0;
    multiVersionContents = stats?.multi_version_contents ?? 0;
  }

  const contentStats = contentRows[0];

  return {
    contents: contentStats?.contents ?? 0,
    approvedContents: contentStats?.approved_contents ?? 0,
    multiVersionContents,
    contentVersions,
    signedVersions,
  };
}

async function deleteLinkedGenerationAssets(executor: SqlExecutor): Promise<void> {
  if (!(await tableExists(executor, 'agent_image_generations'))) return;

  await executor.query(`
    DELETE FROM assets
    WHERE id IN (
      SELECT asset_id
      FROM agent_image_generations
      WHERE asset_id IS NOT NULL
    )
  `);
}

async function deleteContentNotificationsAndEvents(executor: SqlExecutor): Promise<void> {
  if (await tableExists(executor, 'agency_notifications')) {
    await executor.query(`
      DELETE FROM agency_notifications
      WHERE type IN ('week_ready', 'approval_reminder')
    `);
  }

  if (await tableExists(executor, 'events')) {
    await executor.query(`
      DELETE FROM events
      WHERE aggregate_type = 'content'
    `);
  }
}

/** Rompe FK circular contents.current_version_id ↔ content_versions antes del TRUNCATE. */
async function detachCurrentVersions(executor: SqlExecutor): Promise<void> {
  if (!(await tableExists(executor, 'contents'))) return;

  await executor.query(`UPDATE contents SET current_version_id = NULL WHERE current_version_id IS NOT NULL`);
}

async function resolveExistingTables(executor: SqlExecutor): Promise<string[]> {
  const existing: string[] = [];
  for (const table of CLEAR_GENERATED_CONTENTS_TABLES) {
    if (await tableExists(executor, table)) {
      existing.push(table);
    }
  }
  return existing;
}

async function truncateGeneratedContentTables(
  executor: SqlExecutor,
  tables: string[],
): Promise<void> {
  const quoted = tables.map((table) => `"${table}"`).join(', ');
  await executor.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
}

/** Fallback cuando TRUNCATE falla (p. ej. FK circular legacy). Borra todo sin filtrar por aprobación. */
async function deleteGeneratedContentRows(executor: SqlExecutor): Promise<void> {
  if (await tableExists(executor, 'content_approvals')) {
    await executor.query(`DELETE FROM content_approvals`);
  }

  await detachCurrentVersions(executor);

  if (await tableExists(executor, 'content_versions')) {
    await executor.query(`DELETE FROM content_versions`);
  }

  if (await tableExists(executor, 'agent_image_generations')) {
    await executor.query(`DELETE FROM agent_image_generations`);
  }

  if (await tableExists(executor, 'community_manager_batches')) {
    await executor.query(`DELETE FROM community_manager_batches`);
  }

  if (await tableExists(executor, 'contents')) {
    await executor.query(`DELETE FROM contents`);
  }

  if (await tableExists(executor, 'competitor_mentions')) {
    await executor.query(`DELETE FROM competitor_mentions`);
  }

  if (await tableExists(executor, 'competitors')) {
    await executor.query(`DELETE FROM competitors`);
  }

  if (await tableExists(executor, 'agent_competitor_analyses')) {
    await executor.query(`DELETE FROM agent_competitor_analyses`);
  }
}

export async function clearGeneratedContents(
  executor: SqlExecutor,
  logPrefix = '[clear-generated-contents]',
): Promise<ClearGeneratedContentsResult> {
  const before = await readCounts(executor);

  if (before.contents === 0 && before.contentVersions === 0) {
    console.warn(`${logPrefix} Nothing to clear (contents already empty).`);
    return { clearedTables: [], before, after: before };
  }

  console.warn(
    `${logPrefix} Before clear — contents=${before.contents}, approved=${before.approvedContents}, multiVersion=${before.multiVersionContents}, versions=${before.contentVersions}, signedVersions=${before.signedVersions}`,
  );

  await deleteLinkedGenerationAssets(executor);
  await deleteContentNotificationsAndEvents(executor);
  await detachCurrentVersions(executor);

  const existing = await resolveExistingTables(executor);
  if (existing.length === 0) {
    console.warn(`${logPrefix} No target tables found — skipping`);
    return { clearedTables: [], before, after: before };
  }

  try {
    await truncateGeneratedContentTables(executor, existing);
  } catch (error) {
    console.warn(
      `${logPrefix} TRUNCATE failed (${error instanceof Error ? error.message : String(error)}). Falling back to DELETE (includes approved + all versions).`,
    );
    await deleteGeneratedContentRows(executor);
  }

  let after = await readCounts(executor);
  if (after.contents > 0 || after.contentVersions > 0) {
    console.warn(`${logPrefix} Residual rows after TRUNCATE — running DELETE fallback.`);
    await deleteGeneratedContentRows(executor);
    after = await readCounts(executor);
  }

  if (after.contents > 0 || after.contentVersions > 0) {
    throw new Error(
      `${logPrefix} Clear incomplete: contents=${after.contents}, versions=${after.contentVersions} (approved/signed rows may remain)`,
    );
  }

  console.warn(
    `${logPrefix} Cleared ${existing.length} table(s). Tenants, products and SEO keywords preserved.`,
  );

  return { clearedTables: existing, before, after };
}
