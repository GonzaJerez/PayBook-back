import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';
import {AccountsModule} from '../accounts/accounts.module';

@Module({
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],
  imports: [
    AccountsModule
  ]
})
export class SubcategoriesModule {}
