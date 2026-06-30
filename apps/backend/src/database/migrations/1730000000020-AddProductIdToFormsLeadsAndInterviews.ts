import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIdToFormsLeadsAndInterviews1730000000020
  implements MigrationInterface
{
  name = 'AddProductIdToFormsLeadsAndInterviews1730000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE forms
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_forms_product ON forms(product_id)
    `);

    await queryRunner.query(`
      ALTER TABLE leads
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_product ON leads(product_id)
    `);

    await queryRunner.query(`
      ALTER TABLE agent_interviews
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_interviews_product ON agent_interviews(product_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agent_interviews_product`);
    await queryRunner.query(`
      ALTER TABLE agent_interviews DROP COLUMN IF EXISTS product_id
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_leads_product`);
    await queryRunner.query(`
      ALTER TABLE leads DROP COLUMN IF EXISTS product_id
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS idx_forms_product`);
    await queryRunner.query(`
      ALTER TABLE forms DROP COLUMN IF EXISTS product_id
    `);
  }
}
