import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trial } from '../trials/entities/trial.entity';
import { Lead } from '../leads/entities/lead.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(Trial)
    private readonly trialRepo: Repository<Trial>,
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
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