import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FormSubmissionEntity } from '../../forms/infrastructure/typeorm/form-submission.entity';
import { FormEntity } from '../../forms/infrastructure/typeorm/form.entity';
import { SubmitFormResponseDto } from '../../forms/dto/form.response.dto';
import { LeadInteractionEntity } from '../infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from '../infrastructure/typeorm/lead.entity';
import { LeadScoringService } from '../services/lead-scoring.service';
import { SubmitFormCommand } from './submit-form.command';

@Injectable()
export class SubmitFormHandler {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(FormEntity)
    private readonly forms: Repository<FormEntity>,
    private readonly scoring: LeadScoringService,
  ) {}

  async execute(command: SubmitFormCommand): Promise<SubmitFormResponseDto> {
    const form = await this.forms.findOne({
      where: { id: command.formId, isActive: true },
    });

    if (!form) {
      throw new NotFoundException({
        error: 'Form not found or inactive',
        code: 'NOT_FOUND',
      });
    }

    const email = String(command.payload.email ?? '')
      .trim()
      .toLowerCase();

    if (!email) {
      throw new BadRequestException({
        error: 'Email is required',
        code: 'VALIDATION_ERROR',
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const submission = manager.create(FormSubmissionEntity, {
        formId: form.id,
        data: command.payload,
      });
      await manager.save(submission);

      let lead = await manager.findOne(LeadEntity, {
        where: { tenantId: form.tenantId, email },
      });

      let isDuplicate = false;

      if (lead) {
        isDuplicate = true;
        if (command.payload.name) {
          lead.name = String(command.payload.name);
        }
        if (command.payload.phone) {
          lead.phone = String(command.payload.phone);
        }
        if (command.payload.company) {
          lead.company = String(command.payload.company);
        }
        await manager.save(lead);

        await manager.save(
          manager.create(LeadInteractionEntity, {
            leadId: lead.id,
            type: 'duplicate_submission',
            description: 'Form resubmitted with the same email',
            metadata: { formId: form.id, submissionId: submission.id },
          }),
        );
      } else {
        lead = manager.create(LeadEntity, {
          tenantId: form.tenantId,
          email,
          name: command.payload.name ? String(command.payload.name) : null,
          phone: command.payload.phone ? String(command.payload.phone) : null,
          company: command.payload.company ? String(command.payload.company) : null,
          stage: 'prospect',
          score: 0,
          metadata: {},
          formSubmissionId: submission.id,
        });
        lead = await manager.save(lead);

        await manager.save(
          manager.create(LeadInteractionEntity, {
            leadId: lead.id,
            type: 'form_capture',
            description: 'Lead captured from embedded form',
            metadata: { formId: form.id, submissionId: submission.id },
          }),
        );
      }

      submission.leadId = lead.id;
      await manager.save(submission);

      await this.scoring.recalculate(lead.id, manager);

      return {
        submissionId: submission.id,
        leadId: lead.id,
        message: isDuplicate
          ? 'Form submitted; existing lead updated.'
          : 'Form submitted successfully.',
        isDuplicate,
      };
    });
  }
}
