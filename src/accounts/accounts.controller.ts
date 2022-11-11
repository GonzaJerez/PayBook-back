import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
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

import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Auth } from '../auth/decorators/auth.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JoinAccountDto } from './dto/join-account.dto';
import { PushOutAccountDto } from './dto/push-out-account.dto';
import { Account } from './entities/account.entity';

@ApiTags('Accounts')
@Controller('accounts')
@ApiUnauthorizedResponse({ description: 'Token not valid' })
@ApiBearerAuth()
@Auth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Account created', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'To create more accounts user needs to be premium',
  })
  create(@Body() createAccountDto: CreateAccountDto, @GetUser() user: User) {
    return this.accountsService.create(createAccountDto, user);
  }

  @Get()
  @Auth()
  @ApiOkResponse({ description: 'List of user accounts', type: [Account] })
  findAll(@GetUser() user: User) {
    return this.accountsService.findAll(user);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Account by id', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Only can access users that belong the account or admin',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.accountsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Account updated', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Only can update account the admin_account or admin',
  })
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @GetUser() user: User,
  ) {
    return this.accountsService.update(id, updateAccountDto, user);
  }

  @HttpCode(200)
  @Post('join')
  @ApiOkResponse({ description: 'Account modified', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  @ApiForbiddenResponse({
    description: 'The account already has max users possible',
  })
  join(@Body() joinAccountDto: JoinAccountDto, @GetUser() user: User) {
    return this.accountsService.join(joinAccountDto, user);
  }

  @Delete('leave/:id')
  @ApiOkResponse({ description: 'Account modified', type: Account })
  @ApiBadRequestResponse({
    description: 'Some prop is incorrect or some user uuid received is invalid',
  })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  leave(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.accountsService.leave(id, user);
  }

  @Patch('pushout/:id')
  @ApiOkResponse({ description: 'Account modified', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Only can pushout other users the admin_account or admin',
  })
  pushout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() pushOutAccountDto: PushOutAccountDto,
    @GetUser() user: User,
  ) {
    return this.accountsService.pushout(id, pushOutAccountDto, user);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Account deleted', type: Account })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description: 'The account searched doesnt exist or was deleted',
  })
  @ApiForbiddenResponse({
    description: 'Only can remove account the admin_account or admin',
  })
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.accountsService.remove(id, user);
  }
}
