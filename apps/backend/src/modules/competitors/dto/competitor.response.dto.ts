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
