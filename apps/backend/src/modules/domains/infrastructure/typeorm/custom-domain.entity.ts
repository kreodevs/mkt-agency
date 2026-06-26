import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SslStatus, VerificationStatus } from '../../domain/domain.constants';

@Entity({ name: 'custom_domains' })
export class CustomDomainEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  domain!: string;

  @Column({ name: 'cname_value', type: 'varchar', length: 500, nullable: true })
  cnameValue!: string | null;

  @Column({ name: 'verification_token', type: 'varchar', length: 255, nullable: true })
  verificationToken!: string | null;

  @Column({
    name: 'verification_status',
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  verificationStatus!: VerificationStatus;

  @Column({ name: 'ssl_status', type: 'varchar', length: 50, default: 'pending' })
  sslStatus!: SslStatus;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
