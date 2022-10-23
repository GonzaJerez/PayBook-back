import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/entities/user.entity';
import {Auth} from './decorators/auth.decorator';
import {GetUser} from './decorators/get-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  
  @HttpCode(200)
  @Post('login')
  @ApiOkResponse({description:'User was loged', type:User})
  @ApiBadRequestResponse({description:'Bad request'})
  login(@Body() loginUserDto:LoginUserDto){
    return this.authService.login(loginUserDto)
  }

  @Get('checkToken')
  @Auth()
  checkToken(
    @GetUser() user:User
  ){
    return this.authService.checkToken(user)
  }
}
