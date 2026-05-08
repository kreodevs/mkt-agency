import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Post, PostStatus, RejectionReason } from './entities/post.entity';
import { CreatePostDto, ApprovePostDto } from './dto/create-post.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly settingsService: SettingsService,
  ) {}

  async create(tenantId: string, productId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({
      tenantId,
      productId,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    } as any);
    return this.postRepo.save(post) as any;
  }

  async findAll(tenantId: string, productId?: string): Promise<Post[]> {
    const where: any = { tenantId };
    if (productId) where.productId = productId;
    return this.postRepo.find({ where, order: { scheduledAt: 'ASC' } });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post no encontrado');
    return post;
  }

  async approve(id: string, dto: ApprovePostDto) {
    const post = await this.findOne(id);
    if (dto.action === 'approve') {
      post.status = 'approved';

      // Try to publish to X if credentials are configured
      try {
        const settings = await this.settingsService.getOrCreate(post.productId);
        if (settings.xApiKey && settings.xAccessToken) {
          const published = await this.publishToX(post.content, settings);
          if (published) {
            post.status = 'published';
            post.publishedAt = new Date();
          }
        } else {
          post.publishedAt = new Date();
        }
      } catch (err) {
        // X publication failed, keep as 'approved'
        console.warn(`X publish failed for post ${id}:`, (err as Error).message);
        post.publishedAt = new Date();
      }
    } else {
      post.status = 'rejected';
      post.rejectionReason = dto.reason as RejectionReason;
      post.feedbackText = dto.feedbackText || '';
    }
    return this.postRepo.save(post);
  }

  async createNextVersion(id: string, dto: CreatePostDto): Promise<Post> {
    const original = await this.findOne(id);
    const post = this.postRepo.create({
      tenantId: original.tenantId,
      productId: original.productId,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      version: original.version + 1,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
    });
    return this.postRepo.save(post);
  }

  async update(id: string, data: Partial<Post>): Promise<Post> {
    await this.postRepo.update(id, data);
    return this.findOne(id);
  }

  private async publishToX(
    text: string,
    settings: { xApiKey: string; xApiSecret: string; xAccessToken: string; xAccessSecret: string },
  ): Promise<boolean> {
    const url = 'https://api.twitter.com/2/tweets';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: settings.xApiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: settings.xAccessToken,
      oauth_version: '1.0',
    };

    const allParams = { ...oauthParams };
    const paramString = Object.keys(allParams)
      .sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
      .join('&');

    const signatureBase = `POST&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(settings.xApiSecret)}&${encodeURIComponent(settings.xAccessSecret)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .sort()
      .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
      .join(', ');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Twitter API error ${response.status}: ${errorBody}`);
    }

    return true;
  }
}
