import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'campaign_templates' })
export class CampaignTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  objective!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  platforms!: string[];

  @Column({ name: 'budget_distribution', type: 'jsonb', default: () => "'{}'" })
  budgetDistribution!: Record<string, unknown>;

  @Column({ name: 'agent_config', type: 'jsonb', default: () => "'{}'" })
  agentConfig!: Record<string, unknown>;

  @Column({ name: 'is_predefined', type: 'boolean', default: false })
  isPredefined!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
