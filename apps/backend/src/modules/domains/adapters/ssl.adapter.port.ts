export interface SslProvisionInput {
  domainId: string;
  domain: string;
}

export interface SslProvisionResult {
  success: boolean;
  message: string;
}

export interface SslAdapterPort {
  provision(input: SslProvisionInput): Promise<SslProvisionResult>;
}

export const SSL_ADAPTER = Symbol('SSL_ADAPTER');
