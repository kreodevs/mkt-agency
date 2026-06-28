import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { StrategySource, StrategyStatus } from '../../domain/strategy.constants';

@Entity({ name: 'strategy_adjustments' })
export class StrategyAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 50, default: 'analyzing' })
  status!: StrategyStatus;

  @Column({ type: 'varchar', length: 50, default: 'auto' })
  source!: StrategySource;

  @Column({ name: 'brand_brief_id', type: 'uuid', nullable: true })
  brandBriefId!: string | null;

  @Column({ type: 'jsonb', default: {} })
  data!: Record<string, unknown>;

  @Column({ name: 'suggestions', type: 'jsonb', default: [] })
  suggestions!: Array<Record<string, unknown>>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}