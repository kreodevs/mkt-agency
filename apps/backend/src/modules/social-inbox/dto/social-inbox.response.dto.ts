import type { SocialInteractionEntity } from '../infrastructure/typeorm/social-interaction.entity';

export interface SocialInteractionResponseDto {
  id: string;
  productId: string | null;
  platform: string;
  channel: string;
  authorHandle: string | null;
  message: string;
  intent: string;
  sentiment: string | null;
  status: string;
  leadId: string | null;
  suggestedReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSocialInteractionsDto {
  items: SocialInteractionResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export function toSocialInteractionResponse(
  entity: SocialInteractionEntity,
): SocialInteractionResponseDto {
  return {
    id: entity.id,
    productId: entity.productId,
    platform: entity.platform,
    channel: entity.channel,
    authorHandle: entity.authorHandle,
    message: entity.message,
    intent: entity.intent,
    sentiment: entity.sentiment,
    status: entity.status,
    leadId: entity.leadId,
    suggestedReply: entity.suggestedReply,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
