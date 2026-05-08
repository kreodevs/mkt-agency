import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { TenantUser } from './entities/tenant-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TenantUser])],
  exports: [TypeOrmModule],
})
export class UsersModule {}
