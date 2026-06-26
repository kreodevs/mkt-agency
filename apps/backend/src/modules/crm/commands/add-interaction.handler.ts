import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadInteractionResponseDto } from '../dto/lead.response.dto';
import { LeadInteractionEntity } from '../infrastructure/typeorm/lead-interaction.entity';
import { LeadEntity } from '../infrastructure/typeorm/lead.entity';
import { LeadScoringService } from '../services/lead-scoring.service';
import { AddInteractionCommand } from './add-interaction.command';

@Injectable()
export class AddInteractionHandler {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    @InjectRepository(LeadInteractionEntity)
    private readonly interactions: Repository<LeadInteractionEntity>,
    private readonly scoring: LeadScoringService,
  ) {}

  async execute(command: AddInteractionCommand): Promise<LeadInteractionResponseDto> {
    const lead = await this.leads.findOne({
      where: { id: command.leadId, tenantId: command.tenantId },
    });

    if (!lead) {
      throw new NotFoundException({
        error: 'Lead not found',
        code: 'NOT_FOUND',
      });
    }

    const saved = await this.interactions.save(
      this.interactions.create({
        leadId: lead.id,
        type: command.type,
        description: command.description ?? null,
        metadata: command.metadata ?? {},
      }),
    );

    await this.scoring.recalculate(lead.id);

    return this.toResponse(saved);
  }

  private toResponse(entity: LeadInteractionEntity): LeadInteractionResponseDto {
    return {
      id: entity.id,
      leadId: entity.leadId,
      type: entity.type,
      description: entity.description,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
