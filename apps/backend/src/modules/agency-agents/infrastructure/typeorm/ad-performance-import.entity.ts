import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'ad_performance_imports' })
export class AdPerformanceImportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'unknown' })
  platform!: string;

  @Column({ name: 'source_format', type: 'varchar', length: 50, default: 'generic' })
  sourceFormat!: string;

  @Column({ name: 'file_name', type: 'varchar', length: 500 })
  fileName!: string;

  @Column({ name: 'period_start', type: 'date', nullable: true })
  periodStart!: string | null;

  @Column({ name: 'period_end', type: 'date', nullable: true })
  periodEnd!: string | null;

  @Column({ name: 'row_count', type: 'int', default: 0 })
  rowCount!: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  totals!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  rows!: Record<string, unknown>[];

  @Column({ name: 'imported_by', type: 'uuid', nullable: true })
  importedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
