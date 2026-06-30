import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { CAMPAIGN_EXECUTION_MODES } from '../domain/campaign-execution-mode.constants';
import { CAMPAIGN_SCOPES } from '../../product/domain/product.constants';

export class AutoGenerateCampaignDto {
  @IsOptional()
  @IsIn([...CAMPAIGN_EXECUTION_MODES])
  mode?: (typeof CAMPAIGN_EXECUTION_MODES)[number];

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsIn([...CAMPAIGN_SCOPES])
  scope?: (typeof CAMPAIGN_SCOPES)[number];
}
