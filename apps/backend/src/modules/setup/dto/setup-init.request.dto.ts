import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SetupInitRequestDto {
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
