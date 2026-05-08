import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Lead } from '../../leads/entities/lead.entity';
import { Post } from '../../posts/entities/post.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Tenant, (t) => t.products)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @OneToMany(() => Lead, (l) => l.product)
  leads: Lead[];

  @OneToMany(() => Post, (p) => p.product)
  posts: Post[];

  @OneToMany(() => Campaign, (c) => c.product)
  campaigns: Campaign[];
}