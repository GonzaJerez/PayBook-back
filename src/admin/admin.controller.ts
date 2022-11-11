import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('admin/register')
  @ApiCreatedResponse({ description: 'Admin with token', type: User })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiForbiddenResponse({ description: 'Already exist an admin' })
  createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createAdmin(createUserDto);
  }
}
