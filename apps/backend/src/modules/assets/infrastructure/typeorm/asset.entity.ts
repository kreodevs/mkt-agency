import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AssetType } from '../../domain/asset.constants';

@Entity({ name: 'assets' })
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  folderId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: AssetType;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType!: string | null;

  @Column({ name: 'file_key', type: 'varchar', length: 500 })
  fileKey!: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  url!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ name: 'reference_count', type: 'int', default: 0 })
  referenceCount!: number;

  @Column({ name: 'is_in_use', type: 'boolean', default: false })
  isInUse!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
