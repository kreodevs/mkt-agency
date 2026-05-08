import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { TenantUser } from './tenant-user.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 200 })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isSuperAdmin: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TenantUser, (tu) => tu.user)
  tenantUsers: TenantUser[];
}