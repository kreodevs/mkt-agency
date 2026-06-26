import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'budgets' })
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ type: 'varchar', length: 100 })
  platform!: string;

  @Column({ name: 'daily_budget', type: 'decimal', precision: 10, scale: 2 })
  dailyBudget!: string;

  @Column({ name: 'total_budget', type: 'decimal', precision: 12, scale: 2 })
  totalBudget!: string;

  @Column({ name: 'proposed_by_ai', type: 'boolean', default: false })
  proposedByAi!: boolean;

  @Column({ type: 'boolean', default: false })
  approved!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
