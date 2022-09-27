import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import {ValidUserToAccessAccount} from '../common/decorators/valid-user-to-access-account.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('accounts/:idAccount/categories')
@ValidUserToAccessAccount()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Param('idAccount',ParseUUIDPipe) idAccount:string
  ) {
    return this.categoriesService.create(createCategoryDto, idAccount);
  }

  @Get()
  findAll(@Param('idAccount',ParseUUIDPipe) idAccount:string) {
    return this.categoriesService.findAll(idAccount);
  }

  @Get(':id')
  findOne(
    @Param('id',ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
