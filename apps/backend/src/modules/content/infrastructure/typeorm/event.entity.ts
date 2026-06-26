import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'events' })
export class EventEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType!: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
