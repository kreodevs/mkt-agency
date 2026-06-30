import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../domain/product.constants';

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn([...PRODUCT_CATEGORIES])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  priceRange?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  valueProposition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
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
  @IsIn([...PRODUCT_CATEGORIES])
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  priceRange?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  valueProposition?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsIn([...PRODUCT_STATUSES])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class BulkCreateProductsDto {
  @IsArray()
  @IsString({ each: true })
  names!: string[];

  @IsOptional()
  @IsString()
  defaultTargetAudience?: string;

  @IsOptional()
  @IsString()
  defaultValueProposition?: string;

  @IsOptional()
  @IsBoolean()
  markFirstAsPrimary?: boolean;
}

export class ListProductsQueryDto {
  @IsOptional()
  @IsIn([...PRODUCT_STATUSES])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
