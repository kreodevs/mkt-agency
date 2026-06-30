import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class CreateProductFromAnalysisDto {
  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsObject()
  seoTags?: Record<string, string[]>;
}

export class AutoCreateProductsDto {
  @IsArray()
  @IsString({ each: true })
  names!: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsObject()
  seoTags?: Record<string, string[]>;
}