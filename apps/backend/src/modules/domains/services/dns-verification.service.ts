import { Inject, Injectable } from '@nestjs/common';
import {
  DNS_ADAPTER,
  DnsAdapterPort,
  DnsVerificationInput,
  DnsVerificationResult,
} from '../adapters/dns.adapter.port';

@Injectable()
export class DnsVerificationService {
  constructor(@Inject(DNS_ADAPTER) private readonly dnsAdapter: DnsAdapterPort) {}

  verify(input: DnsVerificationInput): Promise<DnsVerificationResult> {
    return this.dnsAdapter.verifyCname(input);
  }
}
