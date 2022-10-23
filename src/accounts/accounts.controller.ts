import {Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, HttpCode} from '@nestjs/common';

import {GetUser} from '../auth/decorators/get-user.decorator';
import {User} from '../users/entities/user.entity';
import {Auth} from '../auth/decorators/auth.decorator';
import {AccountsService} from './accounts.service';
import {CreateAccountDto} from './dto/create-account.dto';
import {UpdateAccountDto} from './dto/update-account.dto';
import {ValidRoles} from '../auth/interfaces';
import {PaginationDto} from '../common/dtos/pagination.dto';
import {JoinAccountDto} from './dto/join-account.dto';
import {PushOutAccountDto} from './dto/push-out-account.dto';

@Controller('accounts')
@Auth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(
    @Body() createAccountDto: CreateAccountDto,
    @GetUser() user: User
  ) {
    return this.accountsService.create(createAccountDto, user);
  }

  @Get()
  @Auth()
  findAll(
    @GetUser() user: User
  ) {
    return this.accountsService.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User
  ) {
    return this.accountsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @GetUser() user: User
  ) {
    return this.accountsService.update(id, updateAccountDto, user);
  }

  @HttpCode(200)
  @Post('join')
  join(
    @Body() joinAccountDto: JoinAccountDto,
    @GetUser() user: User
  ) {
    return this.accountsService.join(joinAccountDto, user)
  }

  @Delete('leave/:id')
  leave(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User
  ) {
    return this.accountsService.leave(id, user)
  }

  @Patch('pushout/:id')
  pushout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() pushOutAccountDto: PushOutAccountDto,
    @GetUser() user: User
  ) {
    return this.accountsService.pushout(id, pushOutAccountDto, user)
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: User
  ) {
    return this.accountsService.remove(id, user);
  }
}
