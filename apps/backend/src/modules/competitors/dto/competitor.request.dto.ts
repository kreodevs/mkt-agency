import { IsOptional, IsString, MaxLength } from 'class-validator';

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
