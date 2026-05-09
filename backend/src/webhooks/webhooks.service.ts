import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trial } from '../trials/entities/trial.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { ProposalsService } from '../proposals/proposals.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Trial)
    private readonly trialRepo: Repository<Trial>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,
    private readonly proposalsService: ProposalsService,
  ) {}

  async handleOralTrackEvent(body: any): Promise<any> {
    this.logger.log(`Webhook recibido: ${body.type}`);

    switch (body.type) {
      case 'trial.started':
        return this.handleTrialStarted(body);

      case 'trial.active':
        return this.handleTrialActive(body);

      case 'trial.dormant':
        return this.handleTrialDormant(body);

      case 'trial.converted':
        return this.handleTrialConverted(body);

      case 'trial.cancelled':
        return this.handleTrialCancelled(body);

      default:
        this.logger.warn(`Tipo de evento desconocido: ${body.type}`);
        return { received: true, unknown: true };
    }
  }

  async handleHermesProposal(body: any): Promise<any> {
    const { tenantId, actionType, payload, productId, rationale } = body;

    if (!tenantId || !actionType || !payload) {
      this.logger.warn('Hermes proposal missing required fields');
      return { received: false, error: 'tenantId, actionType, and payload are required' };
    }

    const proposal = await this.proposalsService.create({
      tenantId,
      productId,
      actionType,
      payload,
      rationale,
    });

    this.logger.log(`Hermes proposal created: ${proposal.id} (${actionType})`);
    return { received: true, proposalId: proposal.id, status: 'pending' };
  }

  async approveProposal(proposalId: string, feedback?: string): Promise<any> {
    try {
      const result = await this.proposalsService.approve(proposalId, 'hermes-webhook', feedback);
      return { approved: true, proposalId: result.id, status: result.status };
    } catch (err: any) {
      this.logger.error(`Error approving proposal ${proposalId}: ${err.message}`);
      return { approved: false, error: err.message };
    }
  }

  async rejectProposal(proposalId: string, reason?: string): Promise<any> {
    try {
      const result = await this.proposalsService.reject(proposalId, reason);
      return { rejected: true, proposalId: result.id, status: result.status };
    } catch (err: any) {
      this.logger.error(`Error rejecting proposal ${proposalId}: ${err.message}`);
      return { rejected: false, error: err.message };
    }
  }

  async getProposalsDebug(tenantId?: string): Promise<any> {
    if (!tenantId) {
      const count = await this.proposalRepo.count();
      return { totalProposals: count, message: 'Proporciona ?tenantId=... para filtrar' };
    }
    const proposals = await this.proposalRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return {
      tenantId,
      total: proposals.length,
      proposals: proposals.map(p => ({
        id: p.id,
        actionType: p.actionType,
        status: p.status,
        productId: p.productId,
        payload: p.payload,
        rationale: p.rationale?.substring(0, 120),
        rejectionReason: p.rejectionReason,
        resultSummary: p.resultSummary,
        createdAt: p.createdAt,
      })),
    };
  }

  private async handleTrialStarted(body: any) {
    const trial = this.trialRepo.create({
      tenantId: 'oraltrack',
      email: body.email,
      name: body.name,
      clinic: body.clinic,
      phone: body.phone,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      phase: 'activation',
      nurturingHistory: [],
    });
    await this.trialRepo.save(trial);

    return { received: true, trialId: trial.id, action: 'start_nurturing' };
  }

  private async handleTrialActive(body: any) {
    const trial = await this.trialRepo.findOne({ where: { email: body.email } });
    if (trial) {
      trial.lastLogin = new Date();
      trial.loginCount += 1;
      trial.status = 'active';
      if (body.featuresUsed) trial.featuresUsed = body.featuresUsed;
      await this.trialRepo.save(trial);
    }
    return { received: true };
  }

  private async handleTrialDormant(body: any) {
    const trial = await this.trialRepo.findOne({ where: { email: body.email } });
    if (trial) {
      trial.status = 'dormant';
      await this.trialRepo.save(trial);
    }
    return { received: true, action: 'send_reengagement' };
  }

  private async handleTrialConverted(body: any) {
    const trial = await this.trialRepo.findOne({ where: { email: body.email } });
    if (trial) {
      trial.status = 'converted';
      trial.convertedAt = new Date();
      trial.convertedPlan = body.plan;
      await this.trialRepo.save(trial);

      // Update matching lead to 'cliente'
      const lead = await this.leadRepo.findOne({ where: { email: body.email } });
      if (lead) {
        lead.stage = 'cliente' as any;
        await this.leadRepo.save(lead);
      }
    }
    return { received: true };
  }

  private async handleTrialCancelled(body: any) {
    const trial = await this.trialRepo.findOne({ where: { email: body.email } });
    if (trial) {
      trial.status = 'cancelled';
      await this.trialRepo.save(trial);
    }
    return { received: true };
  }
}