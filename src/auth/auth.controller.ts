import { Controller, Post, Body, HttpCode, Get } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/entities/user.entity';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { PasswordRecoveryDto } from './dto/password-recovery.dto';
import { SecurityCodeDto } from './dto/security-code.dto';
import { RenewPasswordDto } from './dto/renew-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  @ApiOkResponse({ description: 'User with token', type: User })
  @ApiBadRequestResponse({ description: 'Bad request' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('checkToken')
  @ApiOkResponse({ description: 'User with token', type: User })
  @ApiUnauthorizedResponse({ description: 'Token not valid' })
  @ApiBearerAuth()
  @Auth()
  checkToken(@GetUser() user: User) {
    return this.authService.checkToken(user);
  }

  @Get('checkPremium')
  @ApiOkResponse({
    description: 'User with prop premium validated',
    type: User,
  })
  @ApiUnauthorizedResponse({ description: 'Token not valid' })
  @Auth()
  checkPremium(@GetUser() user: User) {
    return this.authService.checkIsPremium(user);
  }

  @HttpCode(200)
  @Post('password-recovery')
  @ApiOkResponse({ description: 'Send email with code security' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: "Can't found user with email" })
  @ApiForbiddenResponse({
    description: 'User registred with google, cannot recovery password',
  })
  passwordRecovery(@Body() passwordRecoveryDto: PasswordRecoveryDto) {
    return this.authService.passwordRecovery(passwordRecoveryDto);
  }

  @HttpCode(200)
  @Post('validate-security-code')
  @ApiOkResponse({ description: 'Code security is valid' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'Code security invalid' })
  validateSecurityCode(@Body() securityCodeDto: SecurityCodeDto) {
    return this.authService.validateSecurityCode(securityCodeDto);
  }

  @HttpCode(200)
  @Post('renew-password')
  @ApiOkResponse({ description: 'Password updated' })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: "Can't found user with email" })
  @ApiForbiddenResponse({
    description: 'Password cannot be the same at last one',
  })
  renewPassword(@Body() renewPassword: RenewPasswordDto) {
    return this.authService.renewPassword(renewPassword);
  }
}
