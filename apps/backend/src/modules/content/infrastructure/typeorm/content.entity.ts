import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContentStatus } from '../../domain/content.constants';

@Entity({ name: 'contents' })
export class ContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId!: string | null;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: ContentStatus;

  @Column({ name: 'current_version_id', type: 'uuid', nullable: true })
  currentVersionId!: string | null;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate!: string | null;

  /** Red destino (instagram, facebook, …) cuando el contenido viene del Community Manager. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  platform!: string | null;

  /** Formato visual a generar: image | carousel (legacy video → image). */
  @Column({ name: 'visual_format', type: 'varchar', length: 20, default: 'image' })
  visualFormat!: string;

  /** Prompt de escena para IA (NO es el copy publicable del post). */
  @Column({ name: 'visual_prompt', type: 'text', nullable: true })
  visualPrompt!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
