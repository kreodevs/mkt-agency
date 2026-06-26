import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateDomainDto } from './dto/domain.request.dto';
import {
  DomainListResponseDto,
  DomainResponseDto,
} from './dto/domain.response.dto';
import { CustomDomainEntity } from './infrastructure/typeorm/custom-domain.entity';
import { DnsVerificationEntity } from './infrastructure/typeorm/dns-verification.entity';
import { DnsVerificationService } from './services/dns-verification.service';
import { SslProvisionWorkerService } from './workers/ssl-provision.worker';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(CustomDomainEntity)
    private readonly domains: Repository<CustomDomainEntity>,
    @InjectRepository(DnsVerificationEntity)
    private readonly verifications: Repository<DnsVerificationEntity>,
    private readonly dnsVerification: DnsVerificationService,
    private readonly sslWorker: SslProvisionWorkerService,
    private readonly config: ConfigService,
  ) {}

  async list(tenantId: string): Promise<DomainListResponseDto> {
    const items = await this.domains.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return { items: items.map((item) => this.toResponse(item)) };
  }

  async create(tenantId: string, dto: CreateDomainDto): Promise<DomainResponseDto> {
    const normalizedDomain = dto.domain.trim().toLowerCase();
    const verificationToken = randomBytes(16).toString('hex');
    const cnameValue = this.getCnameTarget();

    try {
      const saved = await this.domains.save(
        this.domains.create({
          tenantId,
          domain: normalizedDomain,
          cnameValue,
          verificationToken,
          verificationStatus: 'pending',
          sslStatus: 'pending',
          isActive: false,
        }),
      );

      await this.verifications.save(
        this.verifications.create({
          domainId: saved.id,
          verificationType: 'cname',
          token: verificationToken,
          status: 'pending',
          verifiedAt: null,
        }),
      );

      return this.toResponse(saved);
    } catch (error) {
      if (error instanceof QueryFailedError && (error as { code?: string }).code === '23505') {
        throw new ConflictException('Domain is already registered');
      }
      throw error;
    }
  }

  async findOne(tenantId: string, id: string): Promise<DomainResponseDto> {
    const domain = await this.findOwnedDomain(tenantId, id);
    return this.toResponse(domain);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const domain = await this.findOwnedDomain(tenantId, id);

    if (domain.isActive) {
      throw new ConflictException(
        'Cannot delete the active primary domain. Deactivate it first.',
      );
    }

    await this.domains.remove(domain);
  }

  async verifyDns(tenantId: string, id: string): Promise<DomainResponseDto> {
    const domain = await this.findOwnedDomain(tenantId, id);

    if (!domain.cnameValue || !domain.verificationToken) {
      throw new BadRequestException('Domain is missing verification data');
    }

    const result = await this.dnsVerification.verify({
      domain: domain.domain,
      expectedCname: domain.cnameValue,
      verificationToken: domain.verificationToken,
    });

    const verification = await this.verifications.findOne({
      where: { domainId: domain.id },
      order: { createdAt: 'DESC' },
    });

    if (verification) {
      verification.status = result.verified ? 'verified' : 'failed';
      verification.verifiedAt = result.verified ? new Date() : null;
      await this.verifications.save(verification);
    }

    if (!result.verified) {
      domain.verificationStatus = 'failed';
      await this.domains.save(domain);
      throw new BadRequestException(result.message);
    }

    domain.verificationStatus = 'verified';
    domain.sslStatus = 'processing';
    await this.domains.save(domain);

    this.sslWorker.enqueue(domain.id);

    return this.toResponse(domain);
  }

  private getCnameTarget(): string {
    return this.config.get<string>('DOMAIN_CNAME_TARGET', 'dashboard.mktagency.app');
  }

  private async findOwnedDomain(
    tenantId: string,
    id: string,
  ): Promise<CustomDomainEntity> {
    const domain = await this.domains.findOne({ where: { id, tenantId } });
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    return domain;
  }

  private toResponse(entity: CustomDomainEntity): DomainResponseDto {
    return {
      id: entity.id,
      domain: entity.domain,
      cnameValue: entity.cnameValue,
      verificationToken: entity.verificationToken,
      verificationStatus: entity.verificationStatus,
      sslStatus: entity.sslStatus,
      isActive: entity.isActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
