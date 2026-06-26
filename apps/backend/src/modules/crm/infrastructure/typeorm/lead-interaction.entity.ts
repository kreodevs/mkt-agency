import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'lead_interactions' })
export class LeadInteractionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'lead_id', type: 'uuid' })
  leadId!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
