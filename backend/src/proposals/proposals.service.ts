import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from './entities/proposal.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalExecutorService } from './proposal-executor.service';
import { ProposalNotifierService } from './proposal-notifier.service';

@Injectable()
export class ProposalsService {
  private readonly logger = new Logger(ProposalsService.name);

  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    private readonly executor: ProposalExecutorService,
    private readonly notifier: ProposalNotifierService,
  ) {}

  async create(dto: CreateProposalDto): Promise<Proposal> {
    const proposal = this.proposalRepo.create({
      ...dto,
      status: 'pending',
    } as any);
    const saved = await this.proposalRepo.save(proposal) as any;
    await this.notifier.notifyCreated(saved);
    return saved;
  }

  async findByTenant(
    tenantId: string,
    filters?: { status?: string; productId?: string },
  ): Promise<Proposal[]> {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.productId) where.productId = filters.productId;
    return this.proposalRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async approve(id: string, userId: string, feedback?: string): Promise<Proposal> {
    const proposal = await this.findById(id);
    proposal.status = 'approved' as any;
    proposal.approvedById = userId;
    if (feedback) proposal.resultSummary = feedback;
    await this.proposalRepo.save(proposal);
    await this.notifier.notifyApproved(proposal);
    return this.executeProposal(proposal);
  }

  async reject(id: string, reason?: string): Promise<Proposal> {
    const proposal = await this.findById(id);
    proposal.status = 'rejected' as any;
    proposal.rejectionReason = reason || null as any;
    const saved = await this.proposalRepo.save(proposal);
    await this.notifier.notifyRejected(saved, reason);
    return saved;
  }

  async executeProposal(proposal: Proposal): Promise<Proposal> {
    this.logger.log(`Executing proposal ${proposal.id} of type ${proposal.actionType}`);
    const result = await this.executor.execute(proposal);
    proposal.status = 'executed' as any;
    proposal.resultSummary = result.summary;
    proposal.executedAt = new Date();
    const saved = await this.proposalRepo.save(proposal);
    await this.notifier.notifyExecuted(saved);
    return saved;
  }
}
