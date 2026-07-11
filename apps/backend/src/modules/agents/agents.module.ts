import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { QUEUE_BRAND_INTERVIEW, QUEUE_COMPETITOR_INTEL, QUEUE_IMAGE_GENERATION } from '../../shared/queue/queue.constants';
import { ContentModule } from '../content/content.module';
import { CompanyProfileModule } from '../company-profile/company-profile.module';
import { CompetitorsModule } from '../competitors/competitors.module';
import { ProductModule } from '../product/product.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { ProductEntity } from '../product/infrastructure/typeorm/product.entity';
import { AssetsModule } from '../assets/assets.module';
import { OpenRouterInterviewAdapter } from './adapters/openrouter-interview.adapter';
import { StubInterviewAdapter } from './adapters/stub-interview.adapter';
import { INTERVIEW_ADAPTER, InterviewAdapterPort } from './adapters/interview.adapter.port';
import { OpenRouterWebsiteAnalyzerAdapter } from './adapters/openrouter-website-analyzer.adapter';
import { StubWebsiteAnalyzerAdapter } from './adapters/stub-website-analyzer.adapter';
import { WEBSITE_ANALYZER_ADAPTER, WebsiteAnalyzerAdapterPort } from './adapters/website-analyzer.adapter.port';
import { OpenRouterCompetitorIntelAdapter } from './adapters/openrouter-competitor-intel.adapter';
import { StubCompetitorIntelAdapter } from './adapters/stub-competitor-intel.adapter';
import { COMPETITOR_INTEL_ADAPTER, CompetitorIntelAdapterPort } from './adapters/competitor-intel.adapter.port';
import { OpenRouterImageGenerationAdapter } from './adapters/openrouter-image-generation.adapter';
import { StubImageGenerationAdapter } from './adapters/stub-image-generation.adapter';
import { IMAGE_GENERATION_ADAPTER, ImageGenerationAdapterPort } from './adapters/image-generation.adapter.port';
import { OpenRouterVideoGenerationAdapter } from './adapters/openrouter-video-generation.adapter';
import { StubVideoGenerationAdapter } from './adapters/stub-video-generation.adapter';
import { VIDEO_GENERATION_ADAPTER, VideoGenerationAdapterPort } from './adapters/video-generation.adapter.port';
import {
  ElevenLabsTtsAdapter,
  OpenRouterTtsAdapter,
  StubTtsAdapter,
} from './adapters/tts-generation.adapters';
import { TTS_GENERATION_ADAPTER } from './adapters/tts-generation.adapter.port';
import {
  ReplicateTalkingHeadAdapter,
  StubTalkingHeadAdapter,
} from './adapters/replicate-talking-head.adapter';
import { TALKING_HEAD_ADAPTER } from './adapters/talking-head.adapter.port';
import { TtsGenerationService } from './tts-generation.service';
import { TalkingHeadComposerService } from './talking-head-composer.service';
import { AgentInterviewController } from './agent-interview.controller';
import { AgentInterviewService } from './agent-interview.service';
import { AgentInterviewEntity } from './domain/agent-interview.entity';
import { AgentInterviewMessageEntity } from './domain/agent-interview-message.entity';
import { AgentCompetitorAnalysisEntity } from './domain/agent-competitor-analysis.entity';
import { AgentImageGenerationEntity } from './domain/agent-image-generation.entity';
import { BrandInterviewWorkerService } from './workers/brand-interview.worker';
import { BrandInterviewProcessor } from './workers/brand-interview.processor';
import { ImageGenerationWorkerService } from './workers/image-generation.worker';
import { ImageGenerationProcessor } from './workers/image-generation.processor';
import { CompetitorIntelWorkerService } from './workers/competitor-intel.worker';
import { CompetitorIntelProcessor } from './workers/competitor-intel.processor';
import { CompetitorIntelService } from './competitor-intel.service';
import { CompetitorIntelController } from './competitor-intel.controller';
import { ImageGenerationController } from './image-generation.controller';
import { ImageGenerationService } from './image-generation.service';
import { VideoGenerationService } from './video-generation.service';
import { ImageBrandingService } from './image-branding.service';
import { WebsiteAnalyzerService } from './website-analyzer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentInterviewEntity,
      AgentInterviewMessageEntity,
      AgentCompetitorAnalysisEntity,
      AgentImageGenerationEntity,
      CompanyProfileEntity,
      ProductEntity,
    ]),
    BullModule.registerQueue(
      { name: QUEUE_BRAND_INTERVIEW },
      { name: QUEUE_COMPETITOR_INTEL },
      { name: QUEUE_IMAGE_GENERATION },
    ),
    LlmModule,
    CompanyProfileModule,
    CompetitorsModule,
    ProductModule,
    AssetsModule,
    ContentModule,
  ],
  controllers: [AgentInterviewController, CompetitorIntelController, ImageGenerationController],
  providers: [
    AgentInterviewService,
    StubInterviewAdapter,
    OpenRouterInterviewAdapter,
    BrandInterviewWorkerService,
    BrandInterviewProcessor,
    ImageGenerationWorkerService,
    ImageGenerationProcessor,
    CompetitorIntelService,
    StubCompetitorIntelAdapter,
    OpenRouterCompetitorIntelAdapter,
    CompetitorIntelWorkerService,
    CompetitorIntelProcessor,
    StubImageGenerationAdapter,
    OpenRouterImageGenerationAdapter,
    StubVideoGenerationAdapter,
    OpenRouterVideoGenerationAdapter,
    ElevenLabsTtsAdapter,
    OpenRouterTtsAdapter,
    StubTtsAdapter,
    ReplicateTalkingHeadAdapter,
    StubTalkingHeadAdapter,
    TtsGenerationService,
    TalkingHeadComposerService,
    StubWebsiteAnalyzerAdapter,
    OpenRouterWebsiteAnalyzerAdapter,
    WebsiteAnalyzerService,
    ImageGenerationService,
    VideoGenerationService,
    ImageBrandingService,
    {
      provide: WEBSITE_ANALYZER_ADAPTER,
      useFactory: (
        stub: StubWebsiteAnalyzerAdapter,
        llm: OpenRouterWebsiteAnalyzerAdapter,
        providers: LlmProviderService,
      ): WebsiteAnalyzerAdapterPort => ({
        analyze: async (url) => {
          if (await providers.hasActiveConfigured()) {
            return llm.analyze(url);
          }
          return stub.analyze(url);
        },
      }),
      inject: [StubWebsiteAnalyzerAdapter, OpenRouterWebsiteAnalyzerAdapter, LlmProviderService],
    },
    {
      provide: INTERVIEW_ADAPTER,
      useFactory: (
        stub: StubInterviewAdapter,
        llm: OpenRouterInterviewAdapter,
        providers: LlmProviderService,
      ): InterviewAdapterPort => ({
        generateNextQuestion: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateNextQuestion(context);
          }
          return stub.generateNextQuestion(context);
        },
        generateBrandBrief: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateBrandBrief(context);
          }
          return stub.generateBrandBrief(context);
        },
      }),
      inject: [StubInterviewAdapter, OpenRouterInterviewAdapter, LlmProviderService],
    },
    {
      provide: COMPETITOR_INTEL_ADAPTER,
      useFactory: (
        stub: StubCompetitorIntelAdapter,
        llm: OpenRouterCompetitorIntelAdapter,
        providers: LlmProviderService,
      ): CompetitorIntelAdapterPort => ({
        generateAnalysis: async (competitors, tenantContext) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateAnalysis(competitors, tenantContext);
          }
          return stub.generateAnalysis(competitors, tenantContext);
        },
      }),
      inject: [StubCompetitorIntelAdapter, OpenRouterCompetitorIntelAdapter, LlmProviderService],
    },
    {
      provide: IMAGE_GENERATION_ADAPTER,
      useFactory: (
        stub: StubImageGenerationAdapter,
        llm: OpenRouterImageGenerationAdapter,
        providers: LlmProviderService,
      ): ImageGenerationAdapterPort => ({
        generateImage: async (prompt, options) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateImage(prompt, options);
          }
          return stub.generateImage(prompt, options);
        },
      }),
      inject: [StubImageGenerationAdapter, OpenRouterImageGenerationAdapter, LlmProviderService],
    },
    {
      provide: VIDEO_GENERATION_ADAPTER,
      useFactory: (
        stub: StubVideoGenerationAdapter,
        llm: OpenRouterVideoGenerationAdapter,
        providers: LlmProviderService,
      ): VideoGenerationAdapterPort => ({
        generateVideo: async (prompt, options) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generateVideo(prompt, options);
          }
          return stub.generateVideo(prompt, options);
        },
      }),
      inject: [StubVideoGenerationAdapter, OpenRouterVideoGenerationAdapter, LlmProviderService],
    },
    {
      provide: TTS_GENERATION_ADAPTER,
      useClass: StubTtsAdapter,
    },
    {
      provide: TALKING_HEAD_ADAPTER,
      useClass: StubTalkingHeadAdapter,
    },
  ],
  exports: [
    AgentInterviewService,
    CompetitorIntelService,
    ImageGenerationService,
    TalkingHeadComposerService,
    TtsGenerationService,
    IMAGE_GENERATION_ADAPTER,
  ],
})
export class AgentsModule {}