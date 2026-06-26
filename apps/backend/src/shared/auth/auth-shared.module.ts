import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtTokenService } from './jwt-token.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SuperadminGuard } from '../guards/superadmin.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    SuperadminGuard,
    TenantGuard,
  ],
  exports: [
    JwtTokenService,
    JwtAuthGuard,
    SuperadminGuard,
    TenantGuard,
    PassportModule,
  ],
})
export class AuthSharedModule {}
