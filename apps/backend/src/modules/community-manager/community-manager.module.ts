import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmModule } from '../../shared/ai/llm.module';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { ContentModule } from '../content/content.module';
import { CompanyProfileEntity } from '../company-profile/infrastructure/typeorm/company-profile.entity';
import { TenantEntity } from '../tenant/infrastructure/typeorm/tenant.entity';
import { OpenRouterSocialCopyAdapter } from './adapters/openrouter-social-copy.adapter';
import { StubSocialCopyAdapter } from './adapters/stub-social-copy.adapter';
import {
  SOCIAL_COPY_ADAPTER,
  SocialCopyAdapterPort,
} from './adapters/social-copy.adapter.port';
import { CommunityManagerBatchEntity } from './infrastructure/typeorm/community-manager-batch.entity';
import { TonePresetEntity } from './infrastructure/typeorm/tone-preset.entity';
import { CommunityManagerController } from './community-manager.controller';
import { CommunityManagerService } from './community-manager.service';
import { TonePresetController } from './tone-preset.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommunityManagerBatchEntity,
      TonePresetEntity,
      TenantEntity,
      CompanyProfileEntity,
    ]),
    LlmModule,
    ContentModule,
  ],
  controllers: [CommunityManagerController, TonePresetController],
  providers: [
    CommunityManagerService,
    StubSocialCopyAdapter,
    OpenRouterSocialCopyAdapter,
    {
      provide: SOCIAL_COPY_ADAPTER,
      useFactory: (
        stub: StubSocialCopyAdapter,
        llm: OpenRouterSocialCopyAdapter,
        providers: LlmProviderService,
      ): SocialCopyAdapterPort => ({
        generate: async (context) => {
          if (await providers.hasActiveConfigured()) {
            return llm.generate(context);
          }
          return stub.generate(context);
        },
      }),
      inject: [StubSocialCopyAdapter, OpenRouterSocialCopyAdapter, LlmProviderService],
    },
  ],
  exports: [CommunityManagerService],
})
export class CommunityManagerModule {}