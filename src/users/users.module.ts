import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { AccountsModule } from '../accounts/accounts.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [AuthModule, AccountsModule, ConfigModule],
})
export class UsersModule {}
