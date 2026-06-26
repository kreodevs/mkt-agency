import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { OutboxEntity } from '../company-profile/infrastructure/typeorm/outbox.entity';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { SIGNABLE_STATUSES } from './domain/proposal.constants';
import {
  CreateProposalDto,
  ListProposalsQueryDto,
  RejectProposalDto,
} from './dto/proposal.request.dto';
import {
  CreateProposalResponseDto,
  PaginatedProposalsResponseDto,
  ProposalResponseDto,
} from './dto/proposal.response.dto';
import { ProposalEntity } from './infrastructure/typeorm/proposal.entity';
import { ProposalSignatureService } from './services/proposal-signature.service';
import { ProposalGeneratorWorkerService } from './workers/proposal-generator.worker';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(ProposalEntity)
    private readonly proposals: Repository<ProposalEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(OutboxEntity)
    private readonly outbox: Repository<OutboxEntity>,
    private readonly signatureService: ProposalSignatureService,
    private readonly generatorWorker: ProposalGeneratorWorkerService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateProposalDto,
  ): Promise<CreateProposalResponseDto> {
    if (dto.campaignId) {
      const campaign = await this.campaigns.findOne({
        where: { id: dto.campaignId, tenantId },
      });
      if (!campaign) {
        throw new BadRequestException('Campaign not found');
      }
    }

    const saved = await this.proposals.save(
      this.proposals.create({
        tenantId,
        campaignId: dto.campaignId ?? null,
        title: dto.title.trim(),
        content: {},
        status: 'generating',
      }),
    );

    this.generatorWorker.enqueue(saved.id);

    return { id: saved.id, status: saved.status };
  }

  async list(
    tenantId: string,
    query: ListProposalsQueryDto,
    page = 1,
    limit = 20,
  ): Promise<PaginatedProposalsResponseDto> {
    const qb = this.proposals
      .createQueryBuilder('proposal')
      .where('proposal.tenant_id = :tenantId', { tenantId })
      .orderBy('proposal.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.campaignId) {
      qb.andWhere('proposal.campaign_id = :campaignId', {
        campaignId: query.campaignId,
      });
    }

    if (query.status) {
      qb.andWhere('proposal.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<ProposalResponseDto> {
    const proposal = await this.findOwnedProposal(tenantId, id);
    return this.toResponse(proposal);
  }

  async sign(
    tenantId: string,
    user: AuthenticatedUser,
    id: string,
  ): Promise<ProposalResponseDto> {
    const proposal = await this.findOwnedProposal(tenantId, id);

    if (proposal.status === 'accepted') {
      throw new ConflictException('Proposal is already signed');
    }

    if (!SIGNABLE_STATUSES.includes(proposal.status)) {
      throw new BadRequestException(
        `Proposal cannot be signed in status "${proposal.status}"`,
      );
    }

    if (Object.keys(proposal.content).length === 0) {
      throw new BadRequestException('Proposal has no content to sign');
    }

    const signatureHash = this.signatureService.compute(proposal);
    proposal.signatureHash = signatureHash;
    proposal.signedBy = user.id;
    proposal.signedAt = new Date();
    proposal.status = 'accepted';

    const saved = await this.proposals.save(proposal);

    await this.outbox.save(
      this.outbox.create({
        aggregateType: 'proposal',
        aggregateId: saved.id,
        eventType: 'ProposalSigned',
        payload: {
          proposalId: saved.id,
          tenantId,
          signedBy: user.id,
          signatureHash,
        },
        status: 'pending',
      }),
    );

    return this.toResponse(saved);
  }

  async reject(
    tenantId: string,
    id: string,
    dto: RejectProposalDto,
  ): Promise<ProposalResponseDto> {
    const proposal = await this.findOwnedProposal(tenantId, id);

    if (proposal.status === 'accepted') {
      throw new ConflictException('Signed proposals cannot be rejected');
    }

    if (proposal.status === 'rejected') {
      return this.toResponse(proposal);
    }

    proposal.status = 'rejected';
    if (dto.reason) {
      proposal.content = {
        ...proposal.content,
        rejectionReason: dto.reason,
      };
    }

    const saved = await this.proposals.save(proposal);
    return this.toResponse(saved);
  }

  private async findOwnedProposal(
    tenantId: string,
    id: string,
  ): Promise<ProposalEntity> {
    const proposal = await this.proposals.findOne({ where: { id, tenantId } });
    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }
    return proposal;
  }

  private toResponse(entity: ProposalEntity): ProposalResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      campaignId: entity.campaignId,
      title: entity.title,
      content: entity.content,
      status: entity.status,
      signatureHash: entity.signatureHash,
      signedBy: entity.signedBy,
      signedAt: entity.signedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
