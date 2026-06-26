import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFormsAndCrm1730000000001 implements MigrationInterface {
  name = 'CreateFormsAndCrm1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        fields JSONB NOT NULL DEFAULT '[]',
        style JSONB DEFAULT '{}',
        snippet_js TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        form_submission_id UUID,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        score INTEGER NOT NULL DEFAULT 0,
        stage VARCHAR(50) NOT NULL DEFAULT 'prospect',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_tenant_email ON leads (tenant_id, email)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_leads_form_submission'
        ) THEN
          ALTER TABLE leads
            ADD CONSTRAINT fk_leads_form_submission
            FOREIGN KEY (form_submission_id) REFERENCES form_submissions(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS lead_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS lead_interactions`);
    await queryRunner.query(`ALTER TABLE IF EXISTS leads DROP CONSTRAINT IF EXISTS fk_leads_form_submission`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_submissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS leads`);
    await queryRunner.query(`DROP TABLE IF EXISTS forms`);
  }
}
