import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from '../ormconfig';

import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { AccountsModule } from './accounts/accounts.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CreditPaymentsModule } from './credit_payments/credit_payments.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: process.env.NODE_ENV !== 'prod',
    }),
    CommonModule,
    AccountsModule,
    AdminModule,
    UsersModule,
    SeedModule,
    CategoriesModule,
    SubcategoriesModule,
    ExpensesModule,
    CreditPaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
