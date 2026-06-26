import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class LogoutRequestDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
