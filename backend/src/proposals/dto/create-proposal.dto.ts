import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  @IsIn(['create_post', 'contact_lead', 'score_lead', 'optimize_campaign', 'add_keyword', 'pause_keyword', 'create_campaign', 'custom_message'])
  actionType: string;

  @IsObject()
  payload: Record<string, any>;

  @IsOptional()
  @IsString()
  rationale?: string;
}
