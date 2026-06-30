import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_SECTION_SUGGESTION } from '../../../shared/queue/queue.constants';
import {
  SUGGESTION_ADAPTER,
  SuggestionAdapterPort,
} from '../../ai-agents/adapters/suggestion.adapter.port';
import { ALL_SECTION_KEYS, SectionKey } from '../domain/section-keys';
import { pickSectionSuggestionFields } from '../domain/section-field-keys';
import { CompanyProfileSectionEntity } from '../infrastructure/typeorm/company-profile-section.entity';
import { CompanyProfileEntity } from '../infrastructure/typeorm/company-profile.entity';
import { SectionSuggestionAssignmentEntity } from '../infrastructure/typeorm/section-suggestion-assignment.entity';

export interface SuggestionJobData {
  assignmentId: string;
}

@Injectable()
export class SuggestionWorkerService {
  private readonly logger = new Logger(SuggestionWorkerService.name);

  constructor(
    @InjectRepository(SectionSuggestionAssignmentEntity)
    private readonly assignments: Repository<SectionSuggestionAssignmentEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly profiles: Repository<CompanyProfileEntity>,
    @InjectRepository(CompanyProfileSectionEntity)
    private readonly sections: Repository<CompanyProfileSectionEntity>,
    @Inject(SUGGESTION_ADAPTER)
    private readonly suggestionAdapter: SuggestionAdapterPort,
    @InjectQueue(QUEUE_SECTION_SUGGESTION)
    private readonly queue: Queue<SuggestionJobData>,
  ) {}

  enqueue(assignmentId: string): void {
    void this.queue
      .add(
        'generate',
        { assignmentId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      )
      .catch((error) => {
        this.logger.error(`Failed to enqueue suggestion ${assignmentId}`, error);
      });
  }

  async processAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.assignments.findOne({ where: { id: assignmentId } });
    if (!assignment || assignment.status !== 'pending') {
      return;
    }

    assignment.status = 'processing';
    await this.assignments.save(assignment);

    try {
      const profile = await this.profiles.findOne({ where: { id: assignment.profileId } });
      if (!profile) {
        throw new Error('Company profile not found');
      }

      const section = await this.sections.findOne({
        where: { profileId: profile.id, sectionKey: assignment.sectionKey },
      });

      if (!ALL_SECTION_KEYS.includes(assignment.sectionKey as SectionKey)) {
        throw new Error('Invalid section key');
      }

      const rawSuggestion = await this.suggestionAdapter.generate({
        sectionKey: assignment.sectionKey as SectionKey,
        tenantId: assignment.tenantId,
        profile: {
          companyName: profile.companyName,
          industry: profile.industry,
          website: profile.website,
          brandVoice: profile.brandVoice,
          targetAudienceDesc: profile.targetAudienceDesc,
        },
        currentSectionData: section?.data ?? {},
      });

      const suggestion = pickSectionSuggestionFields(
        assignment.sectionKey as SectionKey,
        rawSuggestion,
      );

      if (Object.keys(suggestion).length === 0) {
        throw new Error('La IA no devolvió campos válidos para esta sección');
      }

      assignment.status = 'completed';
      assignment.result = suggestion;
      assignment.errorMessage = null;
    } catch (error) {
      assignment.status = 'failed';
      assignment.errorMessage =
        error instanceof Error ? error.message : 'Suggestion generation failed';
      assignment.result = null;
    }

    await this.assignments.save(assignment);
  }
}
