import { Body, Controller, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { User } from 'src/auth/entities/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController extends AuthController {

  constructor(
    private readonly adminService: AdminService,
    authService: AuthService
    ) {
    super(authService);
  }

  @Post('register')
  @ApiCreatedResponse({description:'Admin was created', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createAdmin(createUserDto);
  }
}
