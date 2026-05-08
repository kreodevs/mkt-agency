import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export type LeadStage = 'prospecto' | 'contactado' | 'interesado' | 'trial' | 'cliente';
export type LeadSource = 'prospeccion' | 'google_ads' | 'x' | 'referido' | 'manual';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  productId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200, nullable: true })
  clinic: string;

  @Column({ length: 50, nullable: true })
  phone: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ nullable: true })
  score: number;

  @Column({ length: 50, default: 'prospeccion' })
  source: LeadSource;

  @Column({ length: 50, default: 'prospecto' })
  stage: LeadStage;

  @Column({ type: 'text', array: true, nullable: true })
  painPoints: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Product, (p) => p.leads)
  @JoinColumn({ name: 'productId' })
  product: Product;
}