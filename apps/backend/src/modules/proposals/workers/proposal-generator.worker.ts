import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../../campaign/infrastructure/typeorm/campaign.entity';
import { CompanyProfileEntity } from '../../company-profile/infrastructure/typeorm/company-profile.entity';
import { QUEUE_PROPOSAL_GENERATION } from '../../../shared/queue/queue.constants';
import {
  PROPOSAL_ADAPTER,
  ProposalAdapterPort,
} from '../adapters/proposal.adapter.port';
import { ProposalEntity } from '../infrastructure/typeorm/proposal.entity';

export interface ProposalJobData {
  proposalId: string;
}

@Injectable()
export class ProposalGeneratorWorkerService {
  private readonly logger = new Logger(ProposalGeneratorWorkerService.name);

  constructor(
    @InjectRepository(ProposalEntity)
    private readonly proposals: Repository<ProposalEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @Inject(PROPOSAL_ADAPTER)
    private readonly proposalAdapter: ProposalAdapterPort,
    @InjectQueue(QUEUE_PROPOSAL_GENERATION)
    private readonly queue: Queue<ProposalJobData>,
  ) {}

  enqueue(proposalId: string): void {
    void this.queue
      .add(
        'generate',
        { proposalId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue proposal ${proposalId}`, error);
      });
  }

  async processProposal(proposalId: string): Promise<void> {
    const proposal = await this.proposals.findOne({ where: { id: proposalId } });
    if (!proposal || proposal.status !== 'generating') {
      return;
    }

    try {
      const campaign = proposal.campaignId
        ? await this.campaigns.findOne({
            where: { id: proposal.campaignId, tenantId: proposal.tenantId },
          })
        : null;

      const profile =
        (await this.profiles.findOne({ where: { tenantId: proposal.tenantId } })) ??
        null;

      const content = await this.proposalAdapter.generate({
        tenantId: proposal.tenantId,
        title: proposal.title,
        campaign: campaign
          ? {
              id: campaign.id,
              name: campaign.name,
              objective: campaign.objective,
              platforms: campaign.platforms,
              totalBudget: campaign.totalBudget ? Number(campaign.totalBudget) : null,
              strategy: campaign.strategy,
            }
          : null,
        companyProfile: profile
          ? {
              companyName: profile.companyName,
              industry: profile.industry,
              brandVoice: profile.brandVoice,
              targetAudienceDesc: profile.targetAudienceDesc,
              objectives: profile.objectives,
            }
          : null,
      });

      proposal.content = content as unknown as Record<string, unknown>;
      proposal.status = 'draft';
      await this.proposals.save(proposal);
    } catch (error) {
      proposal.status = 'failed';
      proposal.content = {
        error: error instanceof Error ? error.message : 'Proposal generation failed',
      };
      await this.proposals.save(proposal);

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Proposal generation failed for ${proposalId}: ${message}`);
      throw error;
    }
  }
}
