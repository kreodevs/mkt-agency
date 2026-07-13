import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { ProductService } from '../product/product.service';
import { ContentStatus } from './domain/content.constants';
import { normalizeContentVisualFormat } from './domain/content-visual-format.util';
import {
  CreateContentDto,
  FeedbackDto,
  ListContentsQueryDto,
  UpdateContentDto,
} from './dto/content.request.dto';
import {
  ApproveContentResponseDto,
  ContentResponseDto,
  ContentVersionResponseDto,
  PaginatedContentsResponseDto,
  RejectContentResponseDto,
} from './dto/content.response.dto';
import { ContentApprovalEntity } from './infrastructure/typeorm/content-approval.entity';
import { ContentVersionEntity } from './infrastructure/typeorm/content-version.entity';
import { ContentEntity } from './infrastructure/typeorm/content.entity';
import { ContentEventSourcingService } from './services/content-event-sourcing.service';
import { DigitalSignatureService } from './services/digital-signature.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentEntity)
    private readonly contents: Repository<ContentEntity>,
    @InjectRepository(ContentVersionEntity)
    private readonly versions: Repository<ContentVersionEntity>,
    @InjectRepository(ContentApprovalEntity)
    private readonly approvals: Repository<ContentApprovalEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    private readonly productService: ProductService,
    private readonly dataSource: DataSource,
    private readonly signatureService: DigitalSignatureService,
    private readonly eventSourcing: ContentEventSourcingService,
  ) {}

  async list(
    tenantId: string,
    query: ListContentsQueryDto,
  ): Promise<PaginatedContentsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.contents
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId })
      .orderBy('c.updated_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.campaignId) {
      qb.andWhere('c.campaign_id = :campaignId', { campaignId: query.campaignId });
    }
    if (query.type) {
      qb.andWhere('c.type = :type', { type: query.type });
    }
    if (query.status) {
      qb.andWhere('c.status = :status', { status: query.status });
    }
    if (query.productId) {
      qb.andWhere('c.product_id = :productId', { productId: query.productId });
    }

    const [items, total] = await qb.getManyAndCount();
    const responses = await Promise.all(
      items.map((item) => this.toContentResponse(item)),
    );

    return { items: responses, total, page, limit };
  }

  async create(
    tenantId: string,
    authorId: string,
    dto: CreateContentDto,
  ): Promise<ContentResponseDto> {
    if (dto.campaignId) {
      await this.ensureCampaign(tenantId, dto.campaignId);
    }

    const productId = await this.resolveProductId(tenantId, dto);

    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);

      const content = await contentRepo.save(
        contentRepo.create({
          tenantId,
          campaignId: dto.campaignId ?? null,
          productId,
          title: dto.title,
          type: dto.type,
          status: 'draft',
          currentVersionId: null,
          scheduledDate: dto.scheduledDate ?? null,
          platform: dto.platform ?? null,
          visualFormat: normalizeContentVisualFormat(dto.visualFormat),
          visualPrompt: dto.visualPrompt ?? null,
        }),
      );

      const version = await versionRepo.save(
        versionRepo.create({
          contentId: content.id,
          versionNumber: 1,
          authorId,
          title: dto.title,
          body: dto.body,
          assets: dto.assets ?? [],
          reason: null,
          changeSummary: 'Versión inicial',
          signatureHash: null,
          signedAt: null,
        }),
      );

      content.currentVersionId = version.id;
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId: content.id,
        eventType: 'ContentCreated',
        data: { versionId: version.id, versionNumber: 1 },
      });

      return this.toContentResponse(content, version);
    });
  }

  async findOne(tenantId: string, id: string): Promise<ContentResponseDto> {
    const content = await this.findOwnedContent(tenantId, id);
    return this.toContentResponse(content);
  }

  async update(
    tenantId: string,
    authorId: string,
    id: string,
    dto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    this.validateUpdateDto(dto);

    if (this.isMetadataOnlyUpdate(dto)) {
      return this.updateMetadataOnly(tenantId, id, dto);
    }

    return this.updateWithVersion(tenantId, authorId, id, dto);
  }

  private validateUpdateDto(dto: UpdateContentDto): void {
    const hasVersionFields =
      dto.title !== undefined || dto.body !== undefined ||
      dto.assets !== undefined || dto.reason !== undefined || dto.changeSummary !== undefined;
    const hasMetadataOnly =
      (dto.scheduledDate !== undefined || dto.visualFormat !== undefined ||
        dto.platform !== undefined || dto.visualPrompt !== undefined) && !hasVersionFields;

    if (!hasVersionFields && !hasMetadataOnly) {
      throw new BadRequestException({
        error: 'At least one field is required to update content',
        code: 'VALIDATION_ERROR',
      });
    }
  }

  private isMetadataOnlyUpdate(dto: UpdateContentDto): boolean {
    return (
      dto.title === undefined && dto.body === undefined &&
      dto.assets === undefined && dto.reason === undefined && dto.changeSummary === undefined
    );
  }

  private async updateMetadataOnly(
    tenantId: string, id: string, dto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    const content = await this.findOwnedContent(tenantId, id);

    if (dto.scheduledDate !== undefined) content.scheduledDate = dto.scheduledDate ?? null;
    if (dto.visualFormat !== undefined) content.visualFormat = normalizeContentVisualFormat(dto.visualFormat);
    if (dto.platform !== undefined) content.platform = dto.platform ?? null;
    if (dto.visualPrompt !== undefined) content.visualPrompt = dto.visualPrompt ?? null;

    const saved = await this.contents.save(content);
    return this.toContentResponse(saved);
  }

  private async updateWithVersion(
    tenantId: string, authorId: string, id: string, dto: UpdateContentDto,
  ): Promise<ContentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);

      const content = await this.findOwnedContent(tenantId, id);
      const current = await this.getCurrentVersion(content);
      const wasApproved = content.status === 'approved';
      const nextNumber = await this.nextVersionNumber(versionRepo, content.id);

      const version = await versionRepo.save(
        versionRepo.create({
          contentId: content.id,
          versionNumber: nextNumber,
          authorId,
          title: dto.title ?? current.title,
          body: dto.body ?? current.body,
          assets: dto.assets ?? current.assets,
          reason: dto.reason ?? null,
          changeSummary: dto.changeSummary ?? (wasApproved ? 'Nueva versión tras contenido aprobado' : 'Actualización de contenido'),
          signatureHash: null,
          signedAt: null,
        }),
      );

      content.currentVersionId = version.id;
      content.title = version.title;
      if (wasApproved) content.status = 'in_changes';
      else if (content.status === 'rejected') content.status = 'draft';

      this.applyMetadataFields(content, dto);
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId: content.id,
        eventType: wasApproved ? 'ContentModifiedAfterApproval' : 'ContentUpdated',
        data: { versionId: version.id, versionNumber: version.versionNumber },
      });

      return this.toContentResponse(content, version);
    });
  }

  private applyMetadataFields(content: ContentEntity, dto: UpdateContentDto): void {
    if (dto.scheduledDate !== undefined) content.scheduledDate = dto.scheduledDate ?? null;
    if (dto.visualFormat !== undefined) content.visualFormat = normalizeContentVisualFormat(dto.visualFormat);
    if (dto.platform !== undefined) content.platform = dto.platform ?? null;
    if (dto.visualPrompt !== undefined) content.visualPrompt = dto.visualPrompt ?? null;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const content = await this.findOwnedContent(tenantId, id);

    const approvedCount = await this.versions.count({
      where: { contentId: content.id, signatureHash: Not(IsNull()) },
    });

    if (approvedCount > 0) {
      throw new ConflictException({
        error: 'Cannot delete content with approved versions',
        code: 'CONFLICT',
      });
    }

    await this.contents.remove(content);
  }

  /** Elimina la pieza y todo su historial (aprobaciones, versiones firmadas, eventos). */
  async forceRemove(tenantId: string, id: string): Promise<void> {
    await this.findOwnedContent(tenantId, id);

    await this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);
      const approvalRepo = manager.getRepository(ContentApprovalEntity);

      const versions = await versionRepo.find({
        where: { contentId: id },
        select: ['id'],
      });
      const versionIds = versions.map((version) => version.id);

      if (versionIds.length > 0) {
        await approvalRepo.delete({ contentVersionId: In(versionIds) });
      }

      await manager.query(`DELETE FROM agent_image_generations WHERE content_id = $1`, [id]);
      await manager.query(
        `DELETE FROM events WHERE aggregate_type = 'content' AND aggregate_id = $1`,
        [id],
      );

      await contentRepo.update({ id, tenantId }, { currentVersionId: null });
      await versionRepo.delete({ contentId: id });
      await contentRepo.delete({ id, tenantId });
    });
  }

  async listVersions(tenantId: string, contentId: string): Promise<ContentVersionResponseDto[]> {
    await this.findOwnedContent(tenantId, contentId);

    const rows = await this.versions.find({
      where: { contentId },
      order: { versionNumber: 'DESC' },
    });

    return rows.map((row) => this.toVersionResponse(row));
  }

  async getVersion(
    tenantId: string,
    contentId: string,
    versionId: string,
  ): Promise<ContentVersionResponseDto> {
    await this.findOwnedContent(tenantId, contentId);

    const version = await this.versions.findOne({
      where: { id: versionId, contentId },
    });

    if (!version) {
      throw new NotFoundException({
        error: 'Content version not found',
        code: 'NOT_FOUND',
      });
    }

    return this.toVersionResponse(version);
  }

  async revert(
    tenantId: string,
    authorId: string,
    contentId: string,
    versionId: string,
  ): Promise<ContentVersionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);

      const content = await this.findOwnedContent(tenantId, contentId);
      const source = await versionRepo.findOne({ where: { id: versionId, contentId } });

      if (!source) {
        throw new NotFoundException({
          error: 'Content version not found',
          code: 'NOT_FOUND',
        });
      }

      const nextNumber = await this.nextVersionNumber(versionRepo, contentId);

      const version = await versionRepo.save(
        versionRepo.create({
          contentId,
          versionNumber: nextNumber,
          authorId,
          title: source.title,
          body: source.body,
          assets: source.assets,
          reason: `Revert to version ${source.versionNumber}`,
          changeSummary: `Restaurado desde v${source.versionNumber}`,
          signatureHash: null,
          signedAt: null,
        }),
      );

      content.currentVersionId = version.id;
      content.title = version.title;
      content.status = 'draft';
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId,
        eventType: 'ContentReverted',
        data: {
          fromVersionId: source.id,
          fromVersionNumber: source.versionNumber,
          newVersionId: version.id,
        },
      });

      return this.toVersionResponse(version);
    });
  }

  async approveVersion(
    tenantId: string,
    userId: string,
    contentId: string,
    versionId: string,
    dto: FeedbackDto,
  ): Promise<ApproveContentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);
      const approvalRepo = manager.getRepository(ContentApprovalEntity);
      const outboxRepo = manager.getRepository(OutboxEntity);

      const content = await this.findOwnedContent(tenantId, contentId);
      const version = await versionRepo.findOne({ where: { id: versionId, contentId } });

      if (!version) {
        throw new NotFoundException({
          error: 'Content version not found',
          code: 'NOT_FOUND',
        });
      }

      if (version.signatureHash) {
        throw new ConflictException({
          error: 'Content version is already approved.',
          code: 'ALREADY_APPROVED',
        });
      }

      const signatureHash = this.signatureService.compute(version);
      const signedAt = new Date();

      version.signatureHash = signatureHash;
      version.signedAt = signedAt;
      await versionRepo.save(version);

      content.status = 'approved';
      content.currentVersionId = version.id;
      await contentRepo.save(content);

      await approvalRepo.save(
        approvalRepo.create({
          contentVersionId: version.id,
          approvedBy: userId,
          signatureHash,
          status: 'approved',
          feedback: dto.feedback ?? null,
        }),
      );

      await this.eventSourcing.append(manager, {
        contentId,
        eventType: 'ContentApproved',
        data: { versionId: version.id, signatureHash },
        metadata: { approvedBy: userId },
      });

      await outboxRepo.save(
        outboxRepo.create({
          aggregateType: 'content',
          aggregateId: contentId,
          eventType: 'ContentApproved',
          payload: {
            contentId,
            versionId: version.id,
            signatureHash,
            approvedBy: userId,
          },
          status: 'pending',
        }),
      );

      return {
        contentId,
        versionId: version.id,
        versionNumber: version.versionNumber,
        status: 'approved',
        signatureHash,
        signedAt: signedAt.toISOString(),
        message: 'Content approved and frozen.',
      };
    });
  }

  async rejectVersion(
    tenantId: string,
    userId: string,
    contentId: string,
    versionId: string,
    dto: FeedbackDto,
  ): Promise<RejectContentResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);
      const approvalRepo = manager.getRepository(ContentApprovalEntity);

      const content = await this.findOwnedContent(tenantId, contentId);
      const version = await versionRepo.findOne({ where: { id: versionId, contentId } });

      if (!version) {
        throw new NotFoundException({
          error: 'Content version not found',
          code: 'NOT_FOUND',
        });
      }

      if (version.signatureHash) {
        throw new ConflictException({
          error: 'Content version is already approved.',
          code: 'ALREADY_APPROVED',
        });
      }

      await approvalRepo.save(
        approvalRepo.create({
          contentVersionId: version.id,
          approvedBy: userId,
          signatureHash: 'rejected',
          status: 'rejected',
          feedback: dto.feedback ?? null,
        }),
      );

      content.status = 'rejected';
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId,
        eventType: 'ContentRejected',
        data: { versionId: version.id, feedback: dto.feedback ?? null },
      });

      return {
        contentId,
        versionId: version.id,
        status: 'rejected',
        message: 'Content version rejected.',
      };
    });
  }

  async recordChangesRequested(
    tenantId: string,
    authorId: string,
    contentId: string,
    versionId: string,
    feedback: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);
      const approvalRepo = manager.getRepository(ContentApprovalEntity);

      const content = await this.findOwnedContent(tenantId, contentId);
      const source = await versionRepo.findOne({ where: { id: versionId, contentId } });

      if (!source) {
        throw new NotFoundException({
          error: 'Content version not found',
          code: 'NOT_FOUND',
        });
      }

      if (source.signatureHash) {
        throw new ConflictException({
          error: 'Content version is already approved.',
          code: 'ALREADY_APPROVED',
        });
      }

      await approvalRepo.save(
        approvalRepo.create({
          contentVersionId: source.id,
          approvedBy: authorId,
          signatureHash: 'changes_requested',
          status: 'pending',
          feedback,
        }),
      );

      content.status = 'draft';
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId,
        eventType: 'ContentChangesRequested',
        data: { versionId: source.id, feedback },
      });
    });
  }

  async requestChanges(
    tenantId: string,
    authorId: string,
    contentId: string,
    versionId: string,
    dto: FeedbackDto,
  ): Promise<ContentVersionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const contentRepo = manager.getRepository(ContentEntity);
      const versionRepo = manager.getRepository(ContentVersionEntity);
      const approvalRepo = manager.getRepository(ContentApprovalEntity);

      const content = await this.findOwnedContent(tenantId, contentId);
      const source = await versionRepo.findOne({ where: { id: versionId, contentId } });

      if (!source) {
        throw new NotFoundException({
          error: 'Content version not found',
          code: 'NOT_FOUND',
        });
      }

      await approvalRepo.save(
        approvalRepo.create({
          contentVersionId: source.id,
          approvedBy: authorId,
          signatureHash: 'changes_requested',
          status: 'pending',
          feedback: dto.feedback ?? null,
        }),
      );

      const nextNumber = await this.nextVersionNumber(versionRepo, contentId);

      const version = await versionRepo.save(
        versionRepo.create({
          contentId,
          versionNumber: nextNumber,
          authorId,
          title: source.title,
          body: source.body,
          assets: source.assets,
          reason: dto.feedback ?? 'Changes requested',
          changeSummary: dto.feedback ?? 'Cambios solicitados',
          signatureHash: null,
          signedAt: null,
        }),
      );

      content.currentVersionId = version.id;
      content.status = 'draft';
      await contentRepo.save(content);

      await this.eventSourcing.append(manager, {
        contentId,
        eventType: 'ContentChangesRequested',
        data: { versionId: version.id, fromVersionId: source.id },
      });

      return this.toVersionResponse(version);
    });
  }

  private async findOwnedContent(tenantId: string, id: string): Promise<ContentEntity> {
    const content = await this.contents.findOne({ where: { id, tenantId } });
    if (!content) {
      throw new NotFoundException({
        error: 'Content not found',
        code: 'NOT_FOUND',
      });
    }
    return content;
  }

  private async ensureCampaign(tenantId: string, campaignId: string): Promise<CampaignEntity> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId, tenantId } });
    if (!campaign) {
      throw new NotFoundException({
        error: 'Campaign not found',
        code: 'NOT_FOUND',
      });
    }
    return campaign;
  }

  private async resolveProductId(
    tenantId: string,
    dto: Pick<CreateContentDto, 'productId' | 'campaignId'>,
  ): Promise<string | null> {
    if (dto.productId) {
      const product = await this.productService.findOwnedEntity(tenantId, dto.productId);
      if (product.status !== 'active') {
        throw new BadRequestException({
          error: 'Cannot attach content to archived product',
          code: 'PRODUCT_ARCHIVED',
        });
      }
      return product.id;
    }

    if (dto.campaignId) {
      const campaign = await this.ensureCampaign(tenantId, dto.campaignId);
      return campaign.productId;
    }

    return null;
  }

  private async getCurrentVersion(content: ContentEntity): Promise<ContentVersionEntity> {
    if (!content.currentVersionId) {
      throw new NotFoundException({
        error: 'Content has no current version',
        code: 'NOT_FOUND',
      });
    }

    const version = await this.versions.findOne({
      where: { id: content.currentVersionId },
    });

    if (!version) {
      throw new NotFoundException({
        error: 'Content version not found',
        code: 'NOT_FOUND',
      });
    }

    return version;
  }

  private async nextVersionNumber(
    repo: Repository<ContentVersionEntity>,
    contentId: string,
  ): Promise<number> {
    const last = await repo.findOne({
      where: { contentId },
      order: { versionNumber: 'DESC' },
    });
    return (last?.versionNumber ?? 0) + 1;
  }

  private async toContentResponse(
    content: ContentEntity,
    versionOverride?: ContentVersionEntity,
  ): Promise<ContentResponseDto> {
    const version =
      versionOverride ??
      (content.currentVersionId
        ? await this.versions.findOne({ where: { id: content.currentVersionId } })
        : null);

    const response: ContentResponseDto = {
      id: content.id,
      tenantId: content.tenantId,
      campaignId: content.campaignId,
      productId: content.productId ?? null,
      title: content.title,
      type: content.type,
      status: content.status,
      currentVersionId: content.currentVersionId,
      scheduledDate: content.scheduledDate,
      platform: content.platform ?? null,
      visualFormat: normalizeContentVisualFormat(content.visualFormat),
      visualPrompt: content.visualPrompt ?? null,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
    };

    if (version) {
      response.currentVersion = this.toVersionResponse(version);
    }

    return response;
  }

  private toVersionResponse(version: ContentVersionEntity): ContentVersionResponseDto {
    return {
      id: version.id,
      versionNumber: version.versionNumber,
      authorId: version.authorId,
      title: version.title,
      body: version.body,
      assets: version.assets,
      reason: version.reason,
      changeSummary: version.changeSummary,
      signatureHash: version.signatureHash,
      signedAt: version.signedAt?.toISOString() ?? null,
      createdAt: version.createdAt.toISOString(),
    };
  }
}
