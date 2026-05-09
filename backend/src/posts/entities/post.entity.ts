import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export type PostStatus = 'draft' | 'approved' | 'rejected' | 'published';
export type RejectionReason = 'tono_incorrecto' | 'mensaje_no_preciso' | 'arte_no_gusta' | 'momento_inoportuno' | 'otro';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  productId: string;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ length: 50, default: 'draft' })
  status: PostStatus;

  @Column({ length: 50, nullable: true })
  rejectionReason: RejectionReason;

  @Column({ type: 'text', nullable: true })
  feedbackText: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  engagement: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (p) => p.posts)
  @JoinColumn({ name: 'productId' })
  product: Product;
}