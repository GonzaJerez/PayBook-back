import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ValidRoles } from '../auth/interfaces';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController extends AuthController {

  constructor(
    private readonly usersService: UsersService,
    authService: AuthService
  ) {
    super(authService)
  }

  @Post('register')
  @ApiCreatedResponse({status:201,description:'Registred user', type:User})
  @ApiBadRequestResponse({status:400,description:'Bad request'})
  @ApiForbiddenResponse({description:'Forbidden - Only can exist one admin'})
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({description:'Users was founded', type:[User]})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  findAll(@Query() queryParameters:PaginationDto) {
    return this.usersService.findAll(queryParameters);
  }

  @Get(':id')
  @ApiOkResponse({description:'User was founded', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user:User
  ) {
    return this.usersService.findOne(id,user);
  }

  @Patch(':id')
  @ApiOkResponse({description:'User was updated', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only himself user and admins'})
  @ApiBearerAuth()
  @Auth()
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateAuthDto: UpdateUserDto,
    @GetUser() user:User
  ) {
    return this.usersService.update(id, updateAuthDto, user);
  }

  @Delete(':id')
  @ApiOkResponse({description:'User was desactivated', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only himself user and admins'})
  @ApiBearerAuth()
  @Auth()
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user:User
  ) {
    return this.usersService.remove(id, user);
  }


  @Patch('reactivate/:id')
  @ApiOkResponse({description:'User was reactivated', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  reactivate(@Param('id', ParseUUIDPipe) id:string){
    return this.usersService.reactivate(id)
  }

  @Post('premium')
  @Auth()
  becomePremium(
    @GetUser() user:User
  ){
    return this.usersService.becomePremium(user)
  }
}
