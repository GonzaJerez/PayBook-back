import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [
    AuthModule,
    ConfigModule
  ]
})
export class AdminModule {}
