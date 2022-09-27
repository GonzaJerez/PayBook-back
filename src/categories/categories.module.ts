import {Module} from '@nestjs/common';
import {CategoriesService} from './categories.service';
import {CategoriesController} from './categories.controller';
import {AccountsModule} from '../accounts/accounts.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [
    AccountsModule
  ],
})
export class CategoriesModule {}
