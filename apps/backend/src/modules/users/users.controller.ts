import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UpdateProfileRequestDto } from './dto/update-profile.request.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileRequestDto,
    @Req() req: Request,
  ) {
    return this.usersService.updateMe(user, body, req.ip ?? null);
  }
}
