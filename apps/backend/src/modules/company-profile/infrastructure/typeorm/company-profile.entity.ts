import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyProfileSectionEntity } from './company-profile-section.entity';

@Entity({ name: 'company_profiles' })
export class CompanyProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255, nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  industry!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website!: string | null;

  @Column({ name: 'brand_voice', type: 'text', nullable: true })
  brandVoice!: string | null;

  @Column({ name: 'target_audience_desc', type: 'text', nullable: true })
  targetAudienceDesc!: string | null;

  @Column({ type: 'text', nullable: true })
  competitors!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  objectives!: unknown[];

  @Column({ name: 'visual_preferences', type: 'jsonb', default: () => "'{}'" })
  visualPreferences!: Record<string, unknown>;

  @Column({ name: 'completion_percentage', type: 'int', default: 0 })
  completionPercentage!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => CompanyProfileSectionEntity, (section) => section.profile)
  sections!: CompanyProfileSectionEntity[];
}
