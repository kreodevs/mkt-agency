import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductWebsiteUrl1730000000021 implements MigrationInterface {
  name = 'AddProductWebsiteUrl1730000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS website_url varchar(500) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS website_url
    `);
  }
}
