import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../shared/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  LogoutRequestDto,
  RefreshTokenRequestDto,
} from './dto/auth.request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginRequestDto, @Req() req: Request) {
    return this.authService.login(body, req.ip ?? null);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshTokenRequestDto, @Req() req: Request) {
    return this.authService.refresh(body, req.ip ?? null);
  }

  @Public()
  @Post('logout')
  logout(@Body() body: LogoutRequestDto) {
    return this.authService.logout(body);
  }

  @Public()
  @Get('jwks')
  jwks() {
    return this.authService.getJwks();
  }
}
