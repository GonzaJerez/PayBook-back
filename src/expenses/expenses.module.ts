import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Expense} from './entities/expense.entity';
import {AccountsModule} from '../accounts/accounts.module';
import {CreditPaymentsModule} from '../credit_payments/credit_payments.module';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService],
  imports: [
    TypeOrmModule.forFeature([Expense]),
    AccountsModule,
    CreditPaymentsModule
  ],
  exports: [TypeOrmModule]
})
export class ExpensesModule {}
