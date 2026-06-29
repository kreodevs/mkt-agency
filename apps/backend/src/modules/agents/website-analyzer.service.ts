import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  WEBSITE_ANALYZER_ADAPTER,
  WebsiteAnalyzerAdapterPort,
} from './adapters/website-analyzer.adapter.port';

@Injectable()
export class WebsiteAnalyzerService {
  private readonly logger = new Logger(WebsiteAnalyzerService.name);

  constructor(
    @Inject(WEBSITE_ANALYZER_ADAPTER)
    private readonly adapter: WebsiteAnalyzerAdapterPort,
  ) {}

  async analyze(url: string) {
    this.logger.log(`Analyzing website: ${url}`);
    return this.adapter.analyze(url);
  }
}