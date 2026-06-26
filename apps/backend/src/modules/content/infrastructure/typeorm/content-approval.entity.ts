import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'content_approvals' })
export class ContentApprovalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'content_version_id', type: 'uuid' })
  contentVersionId!: string;

  @Column({ name: 'approved_by', type: 'uuid' })
  approvedBy!: string;

  @Column({ name: 'signature_hash', type: 'varchar', length: 128 })
  signatureHash!: string;

  @Column({ type: 'varchar', length: 50 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
