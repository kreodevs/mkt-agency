import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
export type ProposalActionType = 'create_post' | 'contact_lead' | 'score_lead' | 'optimize_campaign' | 'add_keyword' | 'pause_keyword' | 'create_campaign' | 'custom_message';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ length: 50 })
  actionType: ProposalActionType;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  rationale: string;

  @Column({ length: 20, default: 'pending' })
  status: ProposalStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  resultSummary: string;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ nullable: true })
  executedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
