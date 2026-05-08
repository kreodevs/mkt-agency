import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Competitor } from './competitor.entity';

export type MentionSource = 'web' | 'twitter' | 'review' | 'other';
export type MentionSentiment = 'positive' | 'negative' | 'neutral';

@Entity('competitor_mentions')
export class CompetitorMention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  competitorId: string;

  @Column({ length: 20 })
  source: MentionSource;

  @Column({ nullable: true })
  url: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 20 })
  sentiment: MentionSentiment;

  @Column({ type: 'timestamp' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Competitor, (c) => c.id)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
