import { IsString, Matches, MaxLength } from 'class-validator';
import { DOMAIN_NAME_PATTERN } from '../domain/domain.constants';

export class CreateDomainDto {
  @IsString()
  @MaxLength(255)
  @Matches(DOMAIN_NAME_PATTERN, {
    message: 'domain must be a valid hostname (e.g. marketing.example.com)',
  })
  domain!: string;
}
