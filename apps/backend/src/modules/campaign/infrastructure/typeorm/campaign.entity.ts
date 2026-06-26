import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CampaignStatus } from '../../domain/campaign.constants';

@Entity({ name: 'campaigns' })
export class CampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  objective!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: CampaignStatus;

  @Column({ name: 'total_budget', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalBudget!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  platforms!: string[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  strategy!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
