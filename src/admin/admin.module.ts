import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [
    AuthModule,
    ConfigModule,
    UsersModule
  ]
})
export class AdminModule {}
