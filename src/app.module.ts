import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      ssl: process.env.STAGE === 'prod',
      extra: {
        ssl: process.env.STAGE === 'prod'
          ? { rejectUnauthorized: false }
          : null
      },
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: true
    }),
    CommonModule,
    AccountsModule,
    AdminModule,
    UsersModule,
    SeedModule,
    CategoriesModule,
    SubcategoriesModule,
    ExpensesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
