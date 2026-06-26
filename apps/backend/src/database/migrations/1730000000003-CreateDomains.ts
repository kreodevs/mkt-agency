import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDomains1730000000003 implements MigrationInterface {
  name = 'CreateDomains1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS custom_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        domain VARCHAR(255) UNIQUE NOT NULL,
        cname_value VARCHAR(500),
        verification_token VARCHAR(255),
        verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        ssl_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dns_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id UUID NOT NULL REFERENCES custom_domains(id) ON DELETE CASCADE,
        verification_type VARCHAR(50) NOT NULL DEFAULT 'cname',
        token VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS dns_verifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS custom_domains`);
  }
}
