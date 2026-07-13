/**
 * Limpieza idempotente de contenidos generados y ciclo de competidores.
 * Misma lógica que migración 0032; útil cuando 0032 ya está en typeorm_migrations.
 *
 * Borra TODO el pipeline editorial sin filtrar por status (approved, signed, multi-version).
 * Omitir: SKIP_GENERATED_CONTENT_RESET=true
 */
import dataSource from './data-source';
import { clearGeneratedContents } from './clear-generated-contents.util';

async function main(): Promise<void> {
  if (process.env.SKIP_GENERATED_CONTENT_RESET === 'true') {
    console.warn(
      '[clear-generated-contents] SKIP_GENERATED_CONTENT_RESET=true — no se borraron contenidos ni análisis',
    );
    return;
  }

  await dataSource.initialize();

  try {
    await clearGeneratedContents(dataSource, '[clear-generated-contents]');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('[clear-generated-contents] Failed:', error);
  process.exit(1);
});
