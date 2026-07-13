import { MigrationInterface, QueryRunner } from 'typeorm';
import { clearGeneratedContents } from '../clear-generated-contents.util';

/**
 * One-shot: elimina contenido generado y análisis de competidores para empezar de cero
 * sin perder la configuración base del tenant.
 *
 * CONSERVA: tenants, users, sessions, products (incl. keywords/tags SEO), company_profiles,
 *           campaigns, agent_interviews, strategy_adjustments, tone_presets, CRM, assets no
 *           ligados a generaciones IA de contenido, LLM config, etc.
 *
 * BORRA (sin filtrar por status): contents (approved/draft/rejected), content_versions
 *        (incl. signature_hash y multi-versión), content_approvals, events (aggregate content),
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

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.SKIP_GENERATED_CONTENT_RESET === 'true') {
      console.warn(
        '[ClearGeneratedContentsAndCompetitorAnalyses] SKIP_GENERATED_CONTENT_RESET=true — no se borraron contenidos ni análisis',
      );
      return;
    }

    await clearGeneratedContents(
      queryRunner,
      '[ClearGeneratedContentsAndCompetitorAnalyses]',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Irreversible — contenidos y análisis eliminados a propósito.
  }
}
