import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus, RejectionReason } from './entities/post.entity';
import { CreatePostDto, ApprovePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
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
      post.publishedAt = new Date();
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
}