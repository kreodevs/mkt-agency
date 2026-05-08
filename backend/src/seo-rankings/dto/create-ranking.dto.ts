import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateRankingDto {
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  position: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  competitorId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  date?: Date;
}
