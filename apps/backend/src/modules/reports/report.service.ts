import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignEntity } from '../campaign/infrastructure/typeorm/campaign.entity';
import { REPORT_TYPES } from './domain/report.constants';
import { CreateReportDto, ListReportsQueryDto } from './dto/report.request.dto';
import {
  CreateReportResponseDto,
  PaginatedReportsResponseDto,
  ReportResponseDto,
} from './dto/report.response.dto';
import { ReportEntity } from './infrastructure/typeorm/report.entity';
import { ReportGeneratorWorkerService } from './workers/report-generator.worker';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reports: Repository<ReportEntity>,
    @InjectRepository(CampaignEntity)
    private readonly campaigns: Repository<CampaignEntity>,
    private readonly generatorWorker: ReportGeneratorWorkerService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateReportDto,
  ): Promise<CreateReportResponseDto> {
    if (!REPORT_TYPES.includes(dto.type)) {
      throw new BadRequestException('Unsupported report type');
    }

    const config = (dto.config ?? {}) as Record<string, unknown>;

    if (config.campaignId) {
      const campaign = await this.campaigns.findOne({
        where: { id: String(config.campaignId), tenantId },
      });
      if (!campaign) {
        throw new BadRequestException('Campaign not found');
      }
    }

    const saved = await this.reports.save(
      this.reports.create({
        tenantId,
        type: dto.type,
        config,
        data: {},
        status: 'generating',
        generatedBy: null,
      }),
    );

    this.generatorWorker.enqueue(saved.id);

    return { id: saved.id, status: saved.status };
  }

  async list(
    tenantId: string,
    query: ListReportsQueryDto,
    page = 1,
    limit = 20,
  ): Promise<PaginatedReportsResponseDto> {
    const qb = this.reports
      .createQueryBuilder('report')
      .where('report.tenant_id = :tenantId', { tenantId })
      .orderBy('report.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.type) {
      qb.andWhere('report.type = :type', { type: query.type });
    }

    if (query.campaignId) {
      qb.andWhere("report.config->>'campaignId' = :campaignId", {
        campaignId: query.campaignId,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    };
  }

  async findOne(tenantId: string, id: string): Promise<ReportResponseDto> {
    const report = await this.findOwnedReport(tenantId, id);
    return this.toResponse(report);
  }

  private async findOwnedReport(
    tenantId: string,
    id: string,
  ): Promise<ReportEntity> {
    const report = await this.reports.findOne({ where: { id, tenantId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  private toResponse(entity: ReportEntity): ReportResponseDto {
    return {
      id: entity.id,
      tenantId: entity.tenantId,
      type: entity.type,
      config: entity.config,
      data: entity.data,
      generatedBy: entity.generatedBy,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
