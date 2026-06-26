import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'form_submissions' })
export class FormSubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'form_id', type: 'uuid' })
  formId!: string;

  @Column({ name: 'lead_id', type: 'uuid', nullable: true })
  leadId!: string | null;

  @Column({ type: 'jsonb', default: {} })
  data!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
