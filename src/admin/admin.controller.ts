import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

@Controller()
export class AdminController extends AuthController {

  constructor(
    private readonly adminService: AdminService,
    authService: AuthService
    ) {
    super(authService);
  }

  @Post('admin/register')
  @ApiCreatedResponse({description:'Admin was created', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createAdmin(createUserDto);
  }
}
