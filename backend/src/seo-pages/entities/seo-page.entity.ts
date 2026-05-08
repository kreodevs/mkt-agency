import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type SeoPageStatus = 'draft' | 'published';

@Entity('seo_pages')
export class SeoPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  productId: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 200 })
  slug: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 300, nullable: true })
  metaDescription: string;

  @Column({ length: 200, nullable: true })
  h1: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 20, default: 'draft' })
  status: SeoPageStatus;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
