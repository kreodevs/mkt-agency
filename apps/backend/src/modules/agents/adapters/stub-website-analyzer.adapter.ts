import { Injectable } from '@nestjs/common';
import { WebsiteAnalyzerAdapterPort, WebsiteAnalysisResult } from './website-analyzer.adapter.port';

@Injectable()
export class StubWebsiteAnalyzerAdapter implements WebsiteAnalyzerAdapterPort {
  async analyze(url: string): Promise<WebsiteAnalysisResult> {
    return {
      companyName: '',
      industry: 'other',
      website: url,
      description:
        'Conecta un proveedor LLM en Administración → Proveedores LLM para analizar este sitio web automáticamente con IA.',
      targetAudience: '',
      valueProposition: '',
      brandVoice: '',
      productsServices: '',
      competitors: '',
      marketingObjectives: '',
      socialMediaChannels: [],
      extractedFrom: url,
    };
  }
}