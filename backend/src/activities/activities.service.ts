import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  async create(tenantId: string, data: { leadId?: string; type: string; description: string; metadata?: any }): Promise<Activity> {
    const activity = this.activityRepo.create({ tenantId, ...data });
    return this.activityRepo.save(activity);
  }

  async findByLead(leadId: string): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByTenant(tenantId: string): Promise<Activity[]> {
    return this.activityRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}