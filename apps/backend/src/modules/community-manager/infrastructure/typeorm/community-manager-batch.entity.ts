import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'community_manager_batches' })
export class CommunityManagerBatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'jsonb', default: {} })
  data!: Record<string, unknown>;

  @Column({ name: 'posts', type: 'jsonb', default: [] })
  posts!: Array<Record<string, unknown>>;

  @Column({ name: 'published_posts', type: 'jsonb', default: [] })
  publishedPosts!: string[];

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}