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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Subcategory } from './entities/subcategory.entity';

@ApiTags('Subcategories')
@Controller('accounts/:idAccount/categories/:idCategory/subcategories')
@ApiBearerAuth()
@ApiNotFoundResponse({
  description:
    'User cant access to subcategory because account doesnt exist, user dont have permission, subcategory doesnt exist or subcategory was deleted',
})
@ValidUserToAccessAccount()
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Subcategory created', type: Subcategory })
  @ApiBadRequestResponse({ description: 'Some prop is invalid' })
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
  @ApiOkResponse({
    description: 'List of subcategories on a specific category',
    type: [Subcategory],
  })
  @ApiBadRequestResponse({ description: 'Some prop is invalid' })
  findAll(
    @Param('idCategory', ParseUUIDPipe) idCategory: string,
    @GetUser() user: User,
  ) {
    return this.subcategoriesService.findAll(idCategory, user);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Subcategory by id',
    type: Subcategory,
  })
  @ApiBadRequestResponse({ description: 'Some prop is invalid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'Subcategory updated',
    type: Subcategory,
  })
  @ApiBadRequestResponse({ description: 'Some prop is invalid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubcategoryDto: CreateSubcategoryDto,
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'Subcategory deleted',
    type: Subcategory,
  })
  @ApiBadRequestResponse({ description: 'Some prop is invalid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subcategoriesService.remove(id);
  }
}
