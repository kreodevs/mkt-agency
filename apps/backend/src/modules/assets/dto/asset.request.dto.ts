import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ASSET_TYPES } from '../domain/asset.constants';

export class ListAssetsQueryDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsIn([...ASSET_TYPES])
  type?: (typeof ASSET_TYPES)[number];

  @IsOptional()
  @IsString()
  tagIds?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsUUID()
  folderId?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];
}

export class CreateAssetFolderDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class UpdateAssetFolderDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class CreateAssetTagDto {
  @IsString()
  @MaxLength(100)
  name!: string;
}
