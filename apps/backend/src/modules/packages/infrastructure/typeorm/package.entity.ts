import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'packages' })
export class PackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'max_users', type: 'int', default: 5 })
  maxUsers!: number;

  @Column({ name: 'max_assets_size', type: 'bigint', default: 1073741824 })
  maxAssetsSize!: string;

  @Column({ name: 'max_file_size', type: 'bigint', default: 10485760 })
  maxFileSize!: string;

  @Column({ name: 'max_campaigns', type: 'int', nullable: true })
  maxCampaigns!: number | null;

  @Column({ name: 'max_ai_requests_per_day', type: 'int', nullable: true })
  maxAiRequestsPerDay!: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  features!: Record<string, unknown>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
