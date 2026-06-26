import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'content_versions' })
export class ContentVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'content_id', type: 'uuid' })
  contentId!: string;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber!: number;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  assets!: unknown[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary!: string | null;

  @Column({ name: 'signature_hash', type: 'varchar', length: 128, nullable: true })
  signatureHash!: string | null;

  @Column({ name: 'signed_at', type: 'timestamptz', nullable: true })
  signedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
