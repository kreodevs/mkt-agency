import { MigrationInterface, QueryRunner } from 'typeorm';
import { LLM_TASK_TYPES } from '../../shared/ai/llm-task-types';
import { LLM_TASK_METADATA } from '../../shared/ai/llm-task-metadata';
import { RECOMMENDED_LLM_TASK_MODELS } from '../../shared/ai/llm-task-recommended-models';

export class SeedRecommendedLlmTaskModels1740000000046 implements MigrationInterface {
  name = 'SeedRecommendedLlmTaskModels1740000000046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const taskType of LLM_TASK_TYPES) {
      const recommended = RECOMMENDED_LLM_TASK_MODELS[taskType];
      const meta = LLM_TASK_METADATA[taskType];

      await queryRunner.query(
        `
        INSERT INTO llm_task_configs (
          task_type, label, description, model, fallback_model, temperature, provider_id, enabled
        )
        SELECT
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          p.id,
          true
        FROM llm_providers p
        WHERE p.slug = $7
        ON CONFLICT (task_type) DO UPDATE SET
          model = EXCLUDED.model,
          fallback_model = EXCLUDED.fallback_model,
          temperature = EXCLUDED.temperature,
          provider_id = COALESCE(EXCLUDED.provider_id, llm_task_configs.provider_id),
          label = COALESCE(llm_task_configs.label, EXCLUDED.label),
          description = COALESCE(llm_task_configs.description, EXCLUDED.description)
        `,
        [
          taskType,
          meta.label,
          meta.description,
          recommended.model,
          recommended.fallbackModel,
          recommended.temperature,
          recommended.providerSlug,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const taskType of LLM_TASK_TYPES) {
      const meta = LLM_TASK_METADATA[taskType];
      const providerSlug =
        taskType === 'tts_generation'
          ? 'elevenlabs'
          : taskType === 'talking_head_generation'
            ? 'replicate'
            : 'openrouter';

      await queryRunner.query(
        `
        UPDATE llm_task_configs t
        SET
          model = $2,
          fallback_model = NULL,
          temperature = $3,
          provider_id = COALESCE(p.id, t.provider_id)
        FROM llm_providers p
        WHERE t.task_type = $1
          AND p.slug = $4
        `,
        [taskType, meta.defaultModel, meta.temperature, providerSlug],
      );
    }
  }
}
