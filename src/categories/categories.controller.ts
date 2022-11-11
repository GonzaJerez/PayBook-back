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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ValidUserToAccessAccount } from '../common/decorators/valid-user-to-access-account.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('accounts/:idAccount/categories')
@ApiUnauthorizedResponse({ description: 'Token not valid' })
@ApiBearerAuth()
@ApiNotFoundResponse({
  description:
    'User cant access to category because account doesnt exist, user dont have permission, category doesnt exist or category was deleted',
})
@ValidUserToAccessAccount()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Category created', type: Category })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'Already exist category on account with same name',
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
  ) {
    return this.categoriesService.create(createCategoryDto, idAccount);
  }

  @Get()
  @ApiOkResponse({
    description: 'List of categories on account',
    type: [Category],
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findAll(@Param('idAccount', ParseUUIDPipe) idAccount: string) {
    return this.categoriesService.findAll(idAccount);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Category by id', type: Category })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Category updated', type: Category })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'Already exist category on account with same name',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @Body() updateCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, idAccount);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Category removed', type: Category })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
