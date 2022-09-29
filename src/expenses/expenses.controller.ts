import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {ValidUserToAccessAccount} from '../common/decorators/valid-user-to-access-account.decorator';
import {GetUser} from '../auth/decorators/get-user.decorator';
import {User} from '../users/entities/user.entity';
import {FiltersExpensesDto} from './dto/filters-expenses.dto';

@Controller('accounts/:idAccount/expenses')
@ValidUserToAccessAccount()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
    @GetUser() user:User
  ) {
    return this.expensesService.create(createExpenseDto, idAccount, user);
  }

  @Get()
  findAllOnMonth(
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
  ) {
    return this.expensesService.findAllOnMonth(idAccount);
  }

  @Get('statistics')
  statistics(
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
    @Query() queryParameters:FiltersExpensesDto
  ) {
    return this.expensesService.statistics(idAccount, queryParameters);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
  ) {
    return this.expensesService.findOne(id, idAccount);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
    @GetUser('id') userId:string
  ) {
    return this.expensesService.update(id, updateExpenseDto, idAccount, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount:string,
    @GetUser('id') userId:string
  ) {
    return this.expensesService.remove(id, idAccount, userId);
  }
}
