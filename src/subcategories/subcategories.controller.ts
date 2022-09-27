import {Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe} from '@nestjs/common';
import {SubcategoriesService} from './subcategories.service';
import {CreateSubcategoryDto} from './dto/create-subcategory.dto';
import {UpdateSubcategoryDto} from './dto/update-subcategory.dto';
import {ValidUserToAccessCategory} from './decorators/valid-user-to-access-category.decorator';

@Controller('accounts/:idAccount/categories/:idCategory/subcategories')
@ValidUserToAccessCategory()
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
    @Param('idCategory', ParseUUIDPipe) idCategory: string
  ) {
    return this.subcategoriesService.create(createSubcategoryDto, idCategory);
  }

  @Get()
  findAll(
    @Param('idCategory', ParseUUIDPipe) idCategory: string
  ) {
    return this.subcategoriesService.findAll(idCategory);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.remove(id);
  }
}
