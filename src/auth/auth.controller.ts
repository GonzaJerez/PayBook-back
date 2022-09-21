import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, HttpCode } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Auth } from './decorators/auth.decorator';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidRoles } from './interfaces';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({status:201,description:'Registred user', type:User})
  @ApiBadRequestResponse({status:400,description:'Bad request'})
  @ApiForbiddenResponse({description:'Forbidden - Only can exist one admin'})
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Get()
  @ApiOkResponse({description:'Users was founded', type:[User]})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  findAll(@Query() queryParameters:PaginationDto) {
    return this.authService.findAll(queryParameters);
  }

  @Get(':id')
  @ApiOkResponse({description:'User was founded', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.findOne(id);
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
    return this.authService.update(id, updateAuthDto, user);
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
    return this.authService.remove(id, user);
  }
  
  @HttpCode(200)
  @Post('login')
  @ApiOkResponse({description:'User was loged', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  login(@Body() loginUserDto:LoginUserDto){
    return this.authService.login(loginUserDto)
  }

  @Patch('activate/:id')
  @ApiOkResponse({description:'User was reactivated', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  @ApiUnauthorizedResponse({description:'Unauthorized. Token not valid'})
  @ApiForbiddenResponse({description:'Forbidden. Only admins'})
  @ApiBearerAuth()
  @Auth(ValidRoles.ADMIN)
  activate(@Param('id', ParseUUIDPipe) id:string){
    return this.authService.activate(id)
  }

  @Get('test/clean')
  @ApiOkResponse({description:'Table users was cleaned for testing', type:User})
  @ApiForbiddenResponse({description:'Forbidden. Only himself user and admins'})
  clearUsers() {
    return this.authService.cleanUsers();
  }
}
