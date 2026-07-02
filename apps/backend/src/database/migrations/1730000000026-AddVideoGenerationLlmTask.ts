import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoGenerationLlmTask1730000000026 implements MigrationInterface {
  name = 'AddVideoGenerationLlmTask1730000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO llm_task_configs (task_type, label, description, model, temperature)
      VALUES (
        'video_generation',
        'Generación de video',
        'Clips MP4 para reels, GIFs animados y videos sociales vía OpenRouter Video API',
        'bytedance/seedance-2.0-fast',
        0
      )
      ON CONFLICT (task_type) DO UPDATE SET
        label = EXCLUDED.label,
        description = EXCLUDED.description,
        model = EXCLUDED.model,
        temperature = EXCLUDED.temperature
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM llm_task_configs WHERE task_type = 'video_generation'
    `);
  }
}
