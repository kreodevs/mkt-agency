import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTavilyIntegrationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
