import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

@Entity('onboarding_tasks')
export class OnboardingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  onboardingId: string;

  @Column({ length: 100 })
  taskKey: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, default: 'pending' })
  status: TaskStatus;

  @Column()
  order: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
