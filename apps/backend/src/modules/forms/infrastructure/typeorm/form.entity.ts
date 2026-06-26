import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
}

@Entity({ name: 'forms' })
export class FormEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'jsonb', default: [] })
  fields!: FormFieldDefinition[];

  @Column({ type: 'jsonb', default: {} })
  style!: Record<string, unknown>;

  @Column({ name: 'snippet_js', type: 'text', nullable: true })
  snippetJs!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
