import { Module } from '@nestjs/common';
import { CreditPaymentsService } from './credit_payments.service';
import { CreditPaymentsController } from './credit_payments.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import {CreditPayment} from './entities/credit_payment.entity';
import {AccountsModule} from '../accounts/accounts.module';

@Module({
  controllers: [CreditPaymentsController],
  providers: [CreditPaymentsService],
  imports: [
    TypeOrmModule.forFeature([CreditPayment]),
    AccountsModule
  ],
  exports: [ CreditPaymentsService, TypeOrmModule]
})
export class CreditPaymentsModule {}
