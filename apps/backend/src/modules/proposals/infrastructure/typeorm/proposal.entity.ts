import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ProposalStatus } from '../../domain/proposal.constants';

@Entity({ name: 'proposals' })
export class ProposalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId!: string | null;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: ProposalStatus;

  @Column({ name: 'signature_hash', type: 'varchar', length: 128, nullable: true })
  signatureHash!: string | null;

  @Column({ name: 'signed_by', type: 'uuid', nullable: true })
  signedBy!: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
