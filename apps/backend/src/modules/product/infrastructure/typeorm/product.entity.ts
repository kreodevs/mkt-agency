import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ProductCategory, ProductStatus } from '../../domain/product.constants';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: ProductCategory | string | null;

  @Column({ name: 'price_range', type: 'varchar', length: 100, nullable: true })
  priceRange!: string | null;

  @Column({ name: 'target_audience', type: 'text', nullable: true })
  targetAudience!: string | null;

  @Column({ name: 'value_proposition', type: 'text', nullable: true })
  valueProposition!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  keywords!: string[];

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: ProductStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
