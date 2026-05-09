import { Controller, Post, Body, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('has-users')
  async hasUsers() {
    return this.authService.hasUsers();
  }

  @Post('setup')
  async setup(@Body() dto: RegisterDto) {
    return this.authService.setup(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: any) {
    const user = await this.authService.validateUser(req.user.sub);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { id: user.id, name: user.name, email: user.email, isSuperAdmin: user.isSuperAdmin };
  }
}
