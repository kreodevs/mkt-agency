import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AgentInterviewMessageEntity } from './agent-interview-message.entity';

export type InterviewStatus = 'in_progress' | 'completed' | 'failed';
export type AgentType = 'brand_interview';

@Entity({ name: 'agent_interviews' })
export class AgentInterviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'agent_type', type: 'varchar', length: 50 })
  agentType!: AgentType;

  @Column({ type: 'varchar', length: 50, default: 'in_progress' })
  status!: InterviewStatus;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep!: number;

  @Column({ name: 'total_steps', type: 'int', default: 6 })
  totalSteps!: number;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  answers!: Record<string, unknown>;

  @Column({ name: 'brand_brief', type: 'jsonb', nullable: true })
  brandBrief!: Record<string, unknown> | null;

  @Column({ name: 'brand_brief_markdown', type: 'text', nullable: true })
  brandBriefMarkdown!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AgentInterviewMessageEntity, (msg) => msg.interview)
  messages!: AgentInterviewMessageEntity[];
}