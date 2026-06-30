import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateCompetitorDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;
}

export class ListMentionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sentiment?: string;
}

export class DiscoverCompetitorsDto {
  @IsIn(['global', 'country', 'city'])
  scope!: 'global' | 'country' | 'city';

  @ValidateIf((dto) => dto.scope === 'country' || dto.scope === 'city')
  @IsString()
  @MaxLength(120)
  country?: string;

  @ValidateIf((dto) => dto.scope === 'city')
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class BulkCreateCompetitorsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCompetitorDto)
  items!: CreateCompetitorDto[];
}
