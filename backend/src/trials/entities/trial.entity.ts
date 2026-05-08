import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export type TrialStatus = 'active' | 'dormant' | 'converted' | 'cancelled' | 'expired';
export type TrialPhase = 'activation' | 'engagement' | 'profundizacion' | 'cierre';

@Entity('trials')
export class Trial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ nullable: true })
  leadId: string;

  @Column({ length: 200 })
  email: string;

  @Column({ length: 200, nullable: true })
  name: string;

  @Column({ length: 200, nullable: true })
  clinic: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ default: 90 })
  durationDays: number;

  @Column({ length: 50, default: 'active' })
  status: TrialStatus;

  @Column({ length: 50, default: 'activation' })
  phase: TrialPhase;

  @Column({ type: 'date', nullable: true })
  lastLogin: Date;

  @Column({ default: 0 })
  loginCount: number;

  @Column({ type: 'simple-array', nullable: true })
  featuresUsed: string[];

  @Column({ type: 'jsonb', nullable: true })
  nurturingHistory: { day: number; message: string; sentAt: Date; status: string }[];

  @Column({ nullable: true })
  convertedAt: Date;

  @Column({ length: 50, nullable: true })
  convertedPlan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}