import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity({ name: 'agent_competitor_analyses' })
export class AgentCompetitorAnalysisEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: AnalysisStatus;

  @Column({ name: 'competitors_input', type: 'text', nullable: true })
  competitorsInput!: string | null;

  @Column({ name: 'analysis', type: 'jsonb', nullable: true })
  analysis!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}