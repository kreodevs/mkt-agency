import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LlmProviderService } from '../../shared/ai/llm-provider.service';
import { ContentService } from '../content/content.service';
import {
  SOCIAL_COPY_ADAPTER,
  SocialCopyAdapterPort,
  SocialCopyPost,
} from './adapters/social-copy.adapter.port';
import { CommunityManagerBatchEntity } from './infrastructure/typeorm/community-manager-batch.entity';
import {
  GenerateResponse,
  SocialCopyBatchResponse,
} from './dto/community-manager.response.dto';
import { GenerateSocialCopyDto } from './dto/community-manager.request.dto';
import { CreateContentDto } from '../content/dto/content.request.dto';

@Injectable()
export class CommunityManagerService {
  private readonly logger = new Logger(CommunityManagerService.name);

  constructor(
    @InjectRepository(CommunityManagerBatchEntity)
    private readonly batches: Repository<CommunityManagerBatchEntity>,
    @Inject(SOCIAL_COPY_ADAPTER)
    private readonly adapter: SocialCopyAdapterPort,
    private readonly llmProviders: LlmProviderService,
    private readonly contentService: ContentService,
  ) {}

  async list(tenantId: string): Promise<SocialCopyBatchResponse[]> {
    const items = await this.batches.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return items.map((item) => this.toResponse(item));
  }

  async generate(
    tenantId: string,
    userId: string,
    dto: GenerateSocialCopyDto,
  ): Promise<GenerateResponse> {
    if (!dto.platforms?.length) {
      throw new BadRequestException({ error: 'At least one platform is required', code: 'VALIDATION_ERROR' });
    }

    // Create batch record
    const batch = await this.batches.save(
      this.batches.create({
        tenantId,
        data: { platforms: dto.platforms, tone: dto.tone, topics: dto.topics },
        posts: [],
        publishedPosts: [],
      }),
    );

    try {
      // Generate social copy via adapter
      this.logger.log(`Generating ${dto.count} posts for ${dto.platforms.join(', ')}`);
      const result = await this.adapter.generate({
        tenantId,
        platforms: dto.platforms,
        count: dto.count,
        campaignId: dto.campaignId,
        tone: dto.tone,
        topics: dto.topics,
      });

      // Save each post as a Content item, spread across next days
      const publishedPosts: string[] = [];
      const today = new Date();
      for (let i = 0; i < result.posts.length; i++) {
        const post = result.posts[i];
        try {
          const contentDto = new CreateContentDto();
          contentDto.title = post.title;
          contentDto.type = 'social';
          contentDto.body = this.formatPostBody(post);
          contentDto.campaignId = dto.campaignId;
          // Spread posts across next days (starting tomorrow)
          const scheduleDate = new Date(today);
          scheduleDate.setDate(scheduleDate.getDate() + i + 1);
          contentDto.scheduledDate = scheduleDate.toISOString().split('T')[0];

          const content = await this.contentService.create(tenantId, userId, contentDto);

          post.contentId = content.id;
          publishedPosts.push(content.id);
        } catch (err) {
          this.logger.warn(`Failed to save post "${post.title}" as content: ${err}`);
        }
      }

      // Update batch with results
      batch.data = {
        ...batch.data,
        summary: result.summary,
        publishingGuide: result.publishingGuide,
        generatedAt: result.generatedAt,
      };
      batch.posts = result.posts as unknown as Array<Record<string, unknown>>;
      batch.publishedPosts = publishedPosts;
      await this.batches.save(batch);

      return { id: batch.id, status: 'completed' };
    } catch (error) {
      this.logger.error(`Social copy generation failed: ${error instanceof Error ? error.message : error}`);
      batch.errorMessage = error instanceof Error ? error.message : 'Generation failed';
      await this.batches.save(batch);
      return { id: batch.id, status: 'failed' };
    }
  }

  private formatPostBody(post: SocialCopyPost): string {
    const parts = [post.body];
    if (post.hashtags?.length) {
      parts.push('\n\n' + post.hashtags.map((h) => `#${h}`).join(' '));
    }
    return parts.join('');
  }

  private toResponse(entity: CommunityManagerBatchEntity): SocialCopyBatchResponse {
    const data = entity.data as Record<string, unknown>;
    return {
      id: entity.id,
      summary: (data.summary as string) ?? '',
      posts: (entity.posts as unknown as SocialCopyPost[]).map((p) => ({
        id: p.id,
        platform: p.platform,
        title: p.title,
        body: p.body,
        hashtags: p.hashtags,
        visualDescription: p.visualDescription,
        bestTime: p.bestTime,
        targetAudience: p.targetAudience,
        callToAction: p.callToAction,
        tone: p.tone,
        contentId: (p as unknown as Record<string, unknown>).contentId as string | undefined,
      })),
      publishingGuide: (data.publishingGuide as string) ?? '',
      generatedAt: (data.generatedAt as string) ?? entity.createdAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }
}