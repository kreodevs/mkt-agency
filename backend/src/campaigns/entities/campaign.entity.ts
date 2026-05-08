import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Keyword } from './keyword.entity';

export type CampaignStatus = 'active' | 'paused' | 'ended';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  productId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50, default: 'google_ads' })
  platform: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column({ length: 50, default: 'active' })
  status: CampaignStatus;

  @Column({ nullable: true })
  googleAdsId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (p) => p.campaigns)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => Keyword, (k) => k.campaign)
  keywords: Keyword[];
}