import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

export type KeywordStatus = 'active' | 'paused' | 'disabled';

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  cpc: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ default: 0 })
  impressions: number;

  @Column({ length: 50, default: 'active' })
  status: KeywordStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Campaign, (c) => c.keywords)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;
}