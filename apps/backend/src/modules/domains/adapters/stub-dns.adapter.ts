import { Injectable } from '@nestjs/common';
import {
  DnsAdapterPort,
  DnsVerificationInput,
  DnsVerificationResult,
} from './dns.adapter.port';

@Injectable()
export class StubDnsAdapter implements DnsAdapterPort {
  async verifyCname(_input: DnsVerificationInput): Promise<DnsVerificationResult> {
    return {
      verified: true,
      method: 'stub',
      message: 'DNS verification bypassed (DOMAIN_DNS_STUB=true)',
    };
  }
}
