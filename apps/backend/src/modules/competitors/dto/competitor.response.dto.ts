import type { MentionSentiment } from '../domain/competitor.constants';

export class CompetitorResponseDto {
  id!: string;
  name!: string;
  website!: string | null;
  industry!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class CompetitorListResponseDto {
  items!: CompetitorResponseDto[];
}

export class CompetitorMentionResponseDto {
  id!: string;
  competitorId!: string;
  source!: string | null;
  content!: string | null;
  sentiment!: MentionSentiment | null;
  mentionedAt!: string | null;
  createdAt!: string;
}

export class PaginatedMentionsResponseDto {
  items!: CompetitorMentionResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class DiscoveredCompetitorDto {
  name!: string;
  website!: string | null;
  industry!: string | null;
  rationale!: string | null;
}

export class DiscoverCompetitorsResponseDto {
  scope!: 'global' | 'country' | 'city';
  country!: string | null;
  city!: string | null;
  items!: DiscoveredCompetitorDto[];
}

export class DiscoverCompetitorsJobStartedDto {
  jobId!: string;
  status!: 'processing';
}

export class DiscoverCompetitorsJobStatusDto {
  jobId!: string;
  status!: 'processing' | 'completed' | 'failed';
  result?: DiscoverCompetitorsResponseDto;
  error?: string;
}

export class BulkCreateCompetitorsResponseDto {
  created!: CompetitorResponseDto[];
  skipped!: number;
}
