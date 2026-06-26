import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_PROPOSAL_GENERATION } from '../../../shared/queue/queue.constants';
import {
  ProposalGeneratorWorkerService,
  ProposalJobData,
} from './proposal-generator.worker';

@Processor(QUEUE_PROPOSAL_GENERATION)
export class ProposalGeneratorProcessor extends WorkerHost {
  constructor(private readonly proposalWorker: ProposalGeneratorWorkerService) {
    super();
  }

  async process(job: Job<ProposalJobData>): Promise<void> {
    await this.proposalWorker.processProposal(job.data.proposalId);
  }
}
