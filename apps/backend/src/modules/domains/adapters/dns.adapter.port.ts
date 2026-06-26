export interface DnsVerificationInput {
  domain: string;
  expectedCname: string;
  verificationToken: string;
}

export interface DnsVerificationResult {
  verified: boolean;
  method: 'cname' | 'txt' | 'stub' | null;
  message: string;
}

export interface DnsAdapterPort {
  verifyCname(input: DnsVerificationInput): Promise<DnsVerificationResult>;
}

export const DNS_ADAPTER = Symbol('DNS_ADAPTER');
