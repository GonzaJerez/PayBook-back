import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { AccountsModule } from './accounts/accounts.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { SeedModule } from './seed/seed.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PaymentsModule } from './payments/payments.module';
import { CreditPaymentsModule } from './credit_payments/credit_payments.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ssl: process.env.NODE_ENV === 'prod',
      extra: {
        ssl: process.env.NODE_ENV === 'prod'
          ? { rejectUnauthorized: false }
          : null
      },
      type: 'postgres',
      host: (process.env.PROD === 'true') ? process.env.DB_HOST : 'localhost',
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: process.env.NODE_ENV !== 'prod',
      synchronize: process.env.NODE_ENV !== 'prod'
    }),
    CommonModule,
    AccountsModule,
    AdminModule,
    UsersModule,
    SeedModule,
    CategoriesModule,
    SubcategoriesModule,
    ExpensesModule,
    PaymentsModule,
    CreditPaymentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
