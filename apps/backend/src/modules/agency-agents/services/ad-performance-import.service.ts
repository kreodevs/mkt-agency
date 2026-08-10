import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseAdPerformanceCsv } from '../domain/ad-csv-parser.util';
import { AdPerformanceImportEntity } from '../infrastructure/typeorm/ad-performance-import.entity';

const MAX_CSV_BYTES = 5 * 1024 * 1024;

export interface AdPerformanceImportResponse {
  id: string;
  platform: string;
  sourceFormat: string;
  fileName: string;
  periodStart: string | null;
  periodEnd: string | null;
  rowCount: number;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  createdAt: string;
}

@Injectable()
export class AdPerformanceImportService {
  constructor(
    @InjectRepository(AdPerformanceImportEntity)
    private readonly imports: Repository<AdPerformanceImportEntity>,
  ) {}

  async importCsv(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    options: { productId?: string; platform?: 'meta' | 'google' | 'auto' } = {},
  ): Promise<AdPerformanceImportResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ error: 'Archivo CSV requerido', code: 'VALIDATION_ERROR' });
    }

    if (file.size > MAX_CSV_BYTES) {
      throw new BadRequestException({
        error: 'El archivo supera el límite de 5 MB',
        code: 'FILE_TOO_LARGE',
      });
    }

    const raw = file.buffer.toString('utf-8');
    let parsed;

    try {
      parsed = parseAdPerformanceCsv(raw, options.platform ?? 'auto');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV inválido';
      throw new BadRequestException({ error: message, code: 'INVALID_CSV' });
    }

    const saved = await this.imports.save(
      this.imports.create({
        tenantId,
        productId: options.productId ?? null,
        platform: parsed.platform,
        sourceFormat: parsed.sourceFormat,
        fileName: file.originalname || 'import.csv',
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        rowCount: parsed.rows.length,
        totals: parsed.totals as unknown as Record<string, unknown>,
        rows: parsed.rows as unknown as Record<string, unknown>[],
        importedBy: userId,
      }),
    );

    return this.toResponse(saved);
  }

  async listImports(tenantId: string, limit = 10): Promise<AdPerformanceImportResponse[]> {
    const rows = await this.imports.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 50),
    });

    return rows.map((row) => this.toResponse(row));
  }

  async aggregateTotalsSince(
    tenantId: string,
    since: Date,
    productId?: string,
  ): Promise<{
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    importCount: number;
  }> {
    const qb = this.imports
      .createQueryBuilder('i')
      .where('i.tenant_id = :tenantId', { tenantId })
      .andWhere('i.created_at >= :since', { since });

    if (productId) {
      qb.andWhere('(i.product_id = :productId OR i.product_id IS NULL)', { productId });
    }

    const rows = await qb.getMany();
    let spend = 0;
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;

    for (const row of rows) {
      const totals = row.totals as {
        spend?: number;
        impressions?: number;
        clicks?: number;
        conversions?: number;
      };
      spend += Number(totals.spend ?? 0);
      impressions += Number(totals.impressions ?? 0);
      clicks += Number(totals.clicks ?? 0);
      conversions += Number(totals.conversions ?? 0);
    }

    return { spend, impressions, clicks, conversions, importCount: rows.length };
  }

  private toResponse(row: AdPerformanceImportEntity): AdPerformanceImportResponse {
    const totals = row.totals as {
      spend?: number;
      impressions?: number;
      clicks?: number;
      conversions?: number;
    };

    return {
      id: row.id,
      platform: row.platform,
      sourceFormat: row.sourceFormat,
      fileName: row.fileName,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      rowCount: row.rowCount,
      totals: {
        spend: Number(totals.spend ?? 0),
        impressions: Number(totals.impressions ?? 0),
        clicks: Number(totals.clicks ?? 0),
        conversions: Number(totals.conversions ?? 0),
      },
      createdAt: row.createdAt.toISOString(),
    };
  }
}
