import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../shared/auth/jwt-payload.interface';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SuperadminGuard } from '../../shared/guards/superadmin.guard';
import { ImpersonateRequestDto } from './dto/impersonate.request.dto';
import { SuperadminService } from './superadmin.service';

@Controller('superadmin')
@UseGuards(JwtAuthGuard)
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post('impersonate')
  @UseGuards(SuperadminGuard)
  impersonate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ImpersonateRequestDto,
  ) {
    return this.superadminService.impersonate(user, body);
  }

  @Delete('impersonate')
  endImpersonation(@CurrentUser() user: AuthenticatedUser) {
    return this.superadminService.endImpersonation(user);
  }
}
