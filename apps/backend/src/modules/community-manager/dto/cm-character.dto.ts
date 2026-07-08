import {
  IsIn,
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
}

export class CmCharacterStatusResponseDto {
  productId!: string;
  ready!: boolean;
  status!: string;
  portraitAssetId!: string | null;
  previewVideoAssetId!: string | null;
  appearance!: CmCharacterAppearance | null;
  voiceId!: string | null;
  voiceName!: string | null;
  errorMessage!: string | null;
}

export class CmCharacterGenerateResponseDto {
  portraitAssetId?: string;
  previewVideoAssetId?: string;
  status!: string;
  message!: string;
}
