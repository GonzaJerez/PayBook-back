import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';

import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ValidUserToAccessAccount } from '../common/decorators/valid-user-to-access-account.decorator';

@Controller('accounts/:idAccount/categories/:idCategory/subcategories')
@ValidUserToAccessAccount()
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
    @Param('idCategory', ParseUUIDPipe) idCategory: string,
    @GetUser() user: User,
  ) {
    return this.subcategoriesService.create(
      createSubcategoryDto,
      idCategory,
      user,
    );
  }

  @Get()
  findAll(
    @Param('idCategory', ParseUUIDPipe) idCategory: string,
    @GetUser() user: User,
  ) {
    return this.subcategoriesService.findAll(idCategory, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.remove(id);
  }
}
