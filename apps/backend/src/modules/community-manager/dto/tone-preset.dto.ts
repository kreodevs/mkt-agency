import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTonePresetDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  toneText!: string;
}

export class UpdateTonePresetDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  toneText?: string;
}