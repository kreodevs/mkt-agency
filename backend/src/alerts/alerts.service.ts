import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
  ) {}

  async create(tenantId: string, data: { type: string; message: string; leadId?: string }): Promise<Alert> {
    const alert = this.alertRepo.create({ tenantId, ...data });
    return this.alertRepo.save(alert);
  }

  async findByTenant(tenantId: string): Promise<Alert[]> {
    return this.alertRepo.find({
      where: { tenantId, read: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(id: string): Promise<void> {
    await this.alertRepo.update(id, { read: true });
  }
}