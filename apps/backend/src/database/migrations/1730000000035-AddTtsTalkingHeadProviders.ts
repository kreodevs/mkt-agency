import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTtsTalkingHeadProviders1730000000035 implements MigrationInterface {
  name = 'AddTtsTalkingHeadProviders1730000000035';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO llm_providers (slug, name, api_url, default_model, sort_order)
      VALUES
        ('replicate', 'Replicate', 'https://api.replicate.com/v1', 'prunaai/p-video-avatar', 2),
        ('elevenlabs', 'ElevenLabs', 'https://api.elevenlabs.io/v1', 'eleven_multilingual_v2', 3)
      ON CONFLICT (slug) DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO llm_task_configs (task_type, label, description, model, temperature, provider_id, fallback_model)
      SELECT
        'tts_generation',
        'Síntesis de voz (TTS)',
        'Narración en español para reels de la CM virtual (ElevenLabs; fallback Kokoro vía OpenRouter)',
        'eleven_multilingual_v2',
        0,
        p.id,
        'hexgrad/kokoro-82m'
      FROM llm_providers p
      WHERE p.slug = 'elevenlabs'
      ON CONFLICT (task_type) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature,
        provider_id = COALESCE(llm_task_configs.provider_id, EXCLUDED.provider_id),
        fallback_model = EXCLUDED.fallback_model
    `);

    await queryRunner.query(`
      INSERT INTO llm_task_configs (task_type, label, description, model, temperature, provider_id)
      SELECT
        'talking_head_generation',
        'Avatar hablante (lip-sync)',
        'Anima el retrato de la CM con audio TTS vía Replicate p-video-avatar',
        'prunaai/p-video-avatar',
        0,
        p.id
      FROM llm_providers p
      WHERE p.slug = 'replicate'
      ON CONFLICT (task_type) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature,
        provider_id = COALESCE(llm_task_configs.provider_id, EXCLUDED.provider_id)
    `);

    await queryRunner.query(`
      INSERT INTO llm_task_configs (task_type, label, description, model, temperature, provider_id)
      SELECT
        'cm_portrait_generation',
        'Retrato CM virtual',
        'Genera el retrato vertical de la community manager para animar con lip-sync',
        'black-forest-labs/flux.2-pro',
        0,
        p.id
      FROM llm_providers p
      WHERE p.slug = 'openrouter'
      ON CONFLICT (task_type) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature,
        provider_id = COALESCE(llm_task_configs.provider_id, EXCLUDED.provider_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM llm_task_configs
      WHERE task_type IN ('tts_generation', 'talking_head_generation', 'cm_portrait_generation')
    `);
    await queryRunner.query(`
      DELETE FROM llm_providers WHERE slug IN ('replicate', 'elevenlabs')
    `);
  }
}
