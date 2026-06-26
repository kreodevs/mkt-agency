import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_SSL_PROVISION } from '../../../shared/queue/queue.constants';
import { SSL_ADAPTER, SslAdapterPort } from '../adapters/ssl.adapter.port';
import { CustomDomainEntity } from '../infrastructure/typeorm/custom-domain.entity';

export interface SslProvisionJobData {
  domainId: string;
}

@Injectable()
export class SslProvisionWorkerService {
  private readonly logger = new Logger(SslProvisionWorkerService.name);

  constructor(
    @InjectRepository(CustomDomainEntity)
    private readonly domains: Repository<CustomDomainEntity>,
    @Inject(SSL_ADAPTER)
    private readonly sslAdapter: SslAdapterPort,
    @InjectQueue(QUEUE_SSL_PROVISION)
    private readonly queue: Queue<SslProvisionJobData>,
  ) {}

  enqueue(domainId: string): void {
    void this.queue
      .add(
        'provision',
        { domainId },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue SSL job for ${domainId}`, error);
      });
  }

  async processDomain(domainId: string): Promise<void> {
    const domain = await this.domains.findOne({ where: { id: domainId } });
    if (!domain || domain.verificationStatus !== 'verified') {
      return;
    }

    if (domain.sslStatus === 'active') {
      return;
    }

    domain.sslStatus = 'processing';
    await this.domains.save(domain);

    try {
      const result = await this.sslAdapter.provision({
        domainId: domain.id,
        domain: domain.domain,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      await this.domains.update(
        { tenantId: domain.tenantId, isActive: true },
        { isActive: false },
      );

      domain.sslStatus = 'active';
      domain.isActive = true;
      await this.domains.save(domain);

      this.logger.log(`SSL active for ${domain.domain}`);
    } catch (error) {
      domain.sslStatus = 'failed';
      domain.isActive = false;
      await this.domains.save(domain);

      const message = error instanceof Error ? error.message : 'SSL provision failed';
      this.logger.error(`SSL failed for ${domain.domain}: ${message}`);
      throw error;
    }
  }
}
