import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import type { CmCharacterAppearance } from '../domain/cm-character.constants';

export class UpdateCmCharacterAppearanceDto {
  @IsOptional()
  @IsIn(['female', 'male', 'neutral'])
  gender?: CmCharacterAppearance['gender'];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ageRange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  style?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  background?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  voiceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  voiceName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}

export class CreateCmCharacterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

export class SetDefaultCmCharacterDto {
  @IsUUID()
  characterId!: string;
}

export class SelectCmPortraitDto {
  @IsUUID()
  assetId!: string;
}

export class CmCharacterStatusResponseDto {
  characterId!: string;
  name!: string;
  productId!: string;
  ready!: boolean;
  status!: string;
  portraitAssetId!: string | null;
  previewVideoAssetId!: string | null;
  appearance!: CmCharacterAppearance | null;
  voiceId!: string | null;
  voiceName!: string | null;
  errorMessage!: string | null;
  isDefault!: boolean;
}

export class CmCharactersLibraryResponseDto {
  productId!: string;
  defaultCharacterId!: string | null;
  readyCount!: number;
  characters!: CmCharacterStatusResponseDto[];
}

export class CmCharacterGenerateResponseDto {
  characterId!: string;
  portraitAssetId?: string;
  previewVideoAssetId?: string;
  status!: string;
  message!: string;
}
