import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type LlmUsageModality = 'chat' | 'image' | 'video';

@Entity({ name: 'llm_usage_events' })
@Index('idx_llm_usage_events_tenant_created', ['tenantId', 'createdAt'])
@Index('idx_llm_usage_events_created', ['createdAt'])
export class LlmUsageEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'task_type', type: 'varchar', length: 100 })
  taskType!: string;

  @Column({ name: 'provider_id', type: 'uuid', nullable: true })
  providerId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  model!: string;

  @Column({ type: 'varchar', length: 20, default: 'chat' })
  modality!: LlmUsageModality;

  @Column({ name: 'prompt_tokens', type: 'int', default: 0 })
  promptTokens!: number;

  @Column({ name: 'completion_tokens', type: 'int', default: 0 })
  completionTokens!: number;

  @Column({ name: 'total_tokens', type: 'int', default: 0 })
  totalTokens!: number;

  @Column({
    name: 'estimated_cost_usd',
    type: 'numeric',
    precision: 14,
    scale: 6,
    default: 0,
  })
  estimatedCostUsd!: string;

  @Column({ type: 'varchar', length: 20, default: 'success' })
  status!: 'success' | 'error';

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
