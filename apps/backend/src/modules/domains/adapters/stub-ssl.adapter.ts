import { Injectable, Logger } from '@nestjs/common';
import {
  SslAdapterPort,
  SslProvisionInput,
  SslProvisionResult,
} from './ssl.adapter.port';

@Injectable()
export class StubSslAdapter implements SslAdapterPort {
  private readonly logger = new Logger(StubSslAdapter.name);

  async provision(input: SslProvisionInput): Promise<SslProvisionResult> {
    this.logger.log(
      `Stub SSL provision for ${input.domain} (configure ACME in production)`,
    );

    return {
      success: true,
      message: 'SSL certificate provisioned (stub)',
    };
  }
}
