import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTenantOwnerDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'password must contain at least 8 characters, one uppercase letter, one number, and one special character',
  })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

export class CreateTenantRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with optional hyphens',
  })
  slug!: string;

  @IsUUID()
  packageId!: string;

  @ValidateNested()
  @Type(() => CreateTenantOwnerDto)
  owner!: CreateTenantOwnerDto;
}
