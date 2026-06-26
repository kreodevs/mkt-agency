import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { MentionSentiment } from '../../domain/competitor.constants';

@Entity({ name: 'competitor_mentions' })
export class CompetitorMentionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'competitor_id', type: 'uuid' })
  competitorId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source!: string | null;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sentiment!: MentionSentiment | null;

  @Column({ name: 'mentioned_at', type: 'timestamptz', nullable: true })
  mentionedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
