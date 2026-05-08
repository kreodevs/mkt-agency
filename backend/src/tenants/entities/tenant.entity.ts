import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { TenantUser } from '../../users/entities/tenant-user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  ownerId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Product, (p) => p.tenant)
  products: Product[];

  @OneToMany(() => TenantUser, (tu) => tu.tenant)
  tenantUsers: TenantUser[];
}