import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'llm_task_configs' })
export class LlmTaskConfigEntity {
  @PrimaryColumn({ name: 'task_type', type: 'varchar', length: 100 })
  taskType!: string;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'openrouter' })
  provider!: string;

  @Column({ type: 'varchar', length: 255 })
  model!: string;

  @Column({ type: 'numeric', precision: 4, scale: 2, default: 0.7 })
  temperature!: string;

  @Column({ name: 'max_tokens', type: 'int', nullable: true })
  maxTokens!: number | null;

  @Column({ name: 'system_prompt_template', type: 'text', nullable: true })
  systemPromptTemplate!: string | null;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
