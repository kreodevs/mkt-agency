import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SuggestionAssignmentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

@Entity({ name: 'section_suggestion_assignments' })
export class SectionSuggestionAssignmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId!: string;

  @Column({ name: 'section_key', type: 'varchar', length: 100 })
  sectionKey!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: SuggestionAssignmentStatus;

  @Column({ type: 'jsonb', nullable: true })
  result!: Record<string, unknown> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
