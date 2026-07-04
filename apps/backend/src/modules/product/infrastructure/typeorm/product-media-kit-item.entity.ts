import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ProductMediaRole } from '../../domain/product-media-kit.constants';

@Entity({ name: 'product_media_kit_items' })
@Index(['tenantId', 'productId'])
@Index(['productId', 'assetId'], { unique: true })
export class ProductMediaKitItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ type: 'varchar', length: 40, default: 'other' })
  role!: ProductMediaRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label!: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
