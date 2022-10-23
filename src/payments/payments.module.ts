import { Module } from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import {AxiosAdapter} from './adapters/axios.adapter';
import {UsersModule} from '../users/users.module';
import {AuthModule} from '../auth/auth.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, AxiosAdapter],
  imports: [
    ConfigModule,
    AuthModule
  ]
})
export class PaymentsModule {}
