import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StrategyAssignmentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

@Entity({ name: 'campaign_strategy_assignments' })
export class CampaignStrategyAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: StrategyAssignmentStatus;

  @Column({ type: 'jsonb', nullable: true })
  result!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
