import { Injectable } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { TXT_VERIFICATION_PREFIX } from '../domain/domain.constants';
import {
  DnsAdapterPort,
  DnsVerificationInput,
  DnsVerificationResult,
} from './dns.adapter.port';

function normalizeDns(value: string): string {
  return value.toLowerCase().replace(/\.$/, '');
}

@Injectable()
export class NodeDnsAdapter implements DnsAdapterPort {
  async verifyCname(input: DnsVerificationInput): Promise<DnsVerificationResult> {
    const expected = normalizeDns(input.expectedCname);

    try {
      const cnameRecords = await dns.resolveCname(input.domain);
      const matched = cnameRecords.some(
        (record) => normalizeDns(record) === expected,
      );

      if (matched) {
        return {
          verified: true,
          method: 'cname',
          message: 'CNAME record matches expected target',
        };
      }
    } catch {
      // Fall through to TXT lookup
    }

    try {
      const txtHost = `${TXT_VERIFICATION_PREFIX}.${input.domain}`;
      const txtRecords = await dns.resolveTxt(txtHost);
      const flat = txtRecords.map((parts) => parts.join('')).join('');
      if (flat.includes(input.verificationToken)) {
        return {
          verified: true,
          method: 'txt',
          message: 'TXT verification record found',
        };
      }
    } catch {
      // No TXT record
    }

    return {
      verified: false,
      method: null,
      message:
        'DNS verification failed. Point a CNAME to the target or add a TXT record.',
    };
  }
}
