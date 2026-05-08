import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('seo_rankings')
export class SeoRanking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  competitorId: string;

  @Column({ length: 200 })
  keyword: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ type: 'integer' })
  position: number;

  @Column({ length: 500, nullable: true })
  url: string;

  @Column({ type: 'timestamp', nullable: true })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
