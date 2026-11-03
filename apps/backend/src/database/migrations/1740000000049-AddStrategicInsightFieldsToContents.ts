import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrategicInsightFieldsToContents1740000000049 implements MigrationInterface {
  name = 'AddStrategicInsightFieldsToContents1740000000049';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      ADD COLUMN IF NOT EXISTS target_pain_point VARCHAR(300),
      ADD COLUMN IF NOT EXISTS strategic_angle VARCHAR(300),
      ADD COLUMN IF NOT EXISTS persuasion_framework VARCHAR(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contents
      DROP COLUMN IF EXISTS target_pain_point,
      DROP COLUMN IF EXISTS strategic_angle,
      DROP COLUMN IF EXISTS persuasion_framework
    `);
  }
}

