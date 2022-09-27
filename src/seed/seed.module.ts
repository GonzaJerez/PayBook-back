import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import {AuthModule} from '../auth/auth.module';
import {AccountsModule} from '../accounts/accounts.module';
import {CheckDevEnv} from './middlewares/check-dev-env.middleware';
import {CategoriesModule} from '../categories/categories.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports:[
    AuthModule,
    AccountsModule,
    CategoriesModule
  ]
})
export class SeedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CheckDevEnv)
      .forRoutes('seed')
  }
}
