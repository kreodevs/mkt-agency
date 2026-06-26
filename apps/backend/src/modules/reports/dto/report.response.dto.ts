import type { ReportStatus, ReportType } from '../domain/report.constants';

export class ReportResponseDto {
  id!: string;
  tenantId!: string;
  type!: ReportType;
  config!: Record<string, unknown>;
  data!: Record<string, unknown>;
  generatedBy!: string | null;
  status!: ReportStatus;
  createdAt!: string;
  updatedAt!: string;
}

export class CreateReportResponseDto {
  id!: string;
  status!: ReportStatus;
}

export class PaginatedReportsResponseDto {
  items!: ReportResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
