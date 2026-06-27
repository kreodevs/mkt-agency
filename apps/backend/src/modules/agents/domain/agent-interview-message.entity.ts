import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AgentInterviewEntity } from './agent-interview.entity';

export type MessageRole = 'agent' | 'user' | 'system';

@Entity({ name: 'agent_interview_messages' })
export class AgentInterviewMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'interview_id', type: 'uuid' })
  interviewId!: string;

  @ManyToOne(() => AgentInterviewEntity, (interview) => interview.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'interview_id' })
  interview!: AgentInterviewEntity;

  @Column({ type: 'varchar', length: 20 })
  role!: MessageRole;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}