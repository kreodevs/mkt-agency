import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from './user.entity';

export type TenantRole = 'admin' | 'editor' | 'sales' | 'marketing' | 'viewer';

@Entity('tenant_users')
@Unique(['tenantId', 'userId'])
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  @Column({ length: 20 })
  role: TenantRole;

  @ManyToOne(() => Tenant, (t) => t.tenantUsers)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, (u) => u.tenantUsers)
  @JoinColumn({ name: 'userId' })
  user: User;
}