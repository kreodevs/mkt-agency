import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSharedModule } from '../../shared/auth/auth-shared.module';
import { QueueModule } from '../../shared/queue/queue.module';
import { DNS_ADAPTER, DnsAdapterPort } from './adapters/dns.adapter.port';
import { NodeDnsAdapter } from './adapters/node-dns.adapter';
import { StubDnsAdapter } from './adapters/stub-dns.adapter';
import { SSL_ADAPTER, SslAdapterPort } from './adapters/ssl.adapter.port';
import { StubSslAdapter } from './adapters/stub-ssl.adapter';
import { DomainController } from './domain.controller';
import { DomainService } from './domain.service';
import { CustomDomainEntity } from './infrastructure/typeorm/custom-domain.entity';
import { DnsVerificationEntity } from './infrastructure/typeorm/dns-verification.entity';
import { DnsVerificationService } from './services/dns-verification.service';
import { SslProvisionProcessor } from './workers/ssl-provision.processor';
import { SslProvisionWorkerService } from './workers/ssl-provision.worker';

@Module({
  imports: [
    AuthSharedModule,
    QueueModule,
    ConfigModule,
    TypeOrmModule.forFeature([CustomDomainEntity, DnsVerificationEntity]),
  ],
  controllers: [DomainController],
  providers: [
    DomainService,
    DnsVerificationService,
    SslProvisionWorkerService,
    SslProvisionProcessor,
    NodeDnsAdapter,
    StubDnsAdapter,
    StubSslAdapter,
    {
      provide: DNS_ADAPTER,
      useFactory: (
        config: ConfigService,
        node: NodeDnsAdapter,
        stub: StubDnsAdapter,
      ): DnsAdapterPort => {
        const useStub = config.get<string>('DOMAIN_DNS_STUB') === 'true';
        return useStub ? stub : node;
      },
      inject: [ConfigService, NodeDnsAdapter, StubDnsAdapter],
    },
    {
      provide: SSL_ADAPTER,
      useFactory: (stub: StubSslAdapter): SslAdapterPort => stub,
      inject: [StubSslAdapter],
    },
  ],
  exports: [DomainService],
})
export class DomainsModule {}
