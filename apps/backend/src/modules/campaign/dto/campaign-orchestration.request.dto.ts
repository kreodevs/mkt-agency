import { IsIn, IsOptional } from 'class-validator';
import { CAMPAIGN_EXECUTION_MODES } from '../domain/campaign-execution-mode.constants';

export class AutoGenerateCampaignDto {
  @IsOptional()
  @IsIn([...CAMPAIGN_EXECUTION_MODES])
  mode?: (typeof CAMPAIGN_EXECUTION_MODES)[number];
}
