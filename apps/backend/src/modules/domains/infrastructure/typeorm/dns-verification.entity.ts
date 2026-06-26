import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { DnsVerificationType } from '../../domain/domain.constants';

@Entity({ name: 'dns_verifications' })
export class DnsVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'domain_id', type: 'uuid' })
  domainId!: string;

  @Column({ name: 'verification_type', type: 'varchar', length: 50, default: 'cname' })
  verificationType!: DnsVerificationType;

  @Column({ type: 'varchar', length: 255 })
  token!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'verified' | 'failed';

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
