import { IsIn, IsObject, IsOptional, IsUUID } from 'class-validator';
import { REPORT_TYPES, type ReportType } from '../domain/report.constants';

export class CreateReportDto {
  @IsIn(REPORT_TYPES)
  type!: ReportType;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class ListReportsQueryDto {
  @IsOptional()
  @IsIn(REPORT_TYPES)
  type?: ReportType;

  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
