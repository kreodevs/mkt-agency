import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'media_campaign_intents' })
export class MediaCampaignIntentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId!: string | null;

  @Column({ name: 'creative_pack_id', type: 'uuid', nullable: true })
  creativePackId!: string | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  platform!: string;

  @Column({ type: 'varchar', length: 500 })
  name!: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  structure!: Record<string, unknown>;

  @Column({ name: 'daily_budget', type: 'decimal', precision: 12, scale: 2, nullable: true })
  dailyBudget!: string | null;

  @Column({ name: 'total_budget', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalBudget!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: string;

  @Column({ name: 'requires_approval', type: 'boolean', default: true })
  requiresApproval!: boolean;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'launched_at', type: 'timestamptz', nullable: true })
  launchedAt!: Date | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
