import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ValidUserToAccessAccount } from '../common/decorators/valid-user-to-access-account.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { FiltersExpensesDto } from './dto/filters-expenses.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Expense } from './entities/expense.entity';
import { PrincipalAmountsResponseDto } from './dto/principal-amounts-response.dto';
import { StatisticsResponseDto } from './dto/statistics-response.dto';

@ApiTags('Expenses')
@Controller('accounts/:idAccount/expenses')
@ApiBearerAuth()
@ApiNotFoundResponse({
  description:
    'User cant access to expense because account doesnt exist, user dont have permission, expense doesnt exist or expense was deleted',
})
@ValidUserToAccessAccount()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Expense created', type: Expense })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @GetUser() user: User,
  ) {
    return this.expensesService.create(createExpenseDto, idAccount, user);
  }

  @Get()
  @ApiOkResponse({ description: 'List of expenses', type: [Expense] })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findAll(
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @Query() queryParameters: PaginationDto,
  ) {
    return this.expensesService.findAll(idAccount, queryParameters);
  }

  @Get('statistics/main')
  @ApiOkResponse({
    description: 'Principal amounts',
    type: PrincipalAmountsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findPrincipalAmounts(@Param('idAccount', ParseUUIDPipe) idAccount: string) {
    return this.expensesService.findPrincipalAmounts(idAccount);
  }

  @Post('statistics')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Expenses filtered with amounts by category / subcategory',
    type: StatisticsResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  statistics(
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @Body() filters: FiltersExpensesDto,
  ) {
    return this.expensesService.statistics(idAccount, filters);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Found expense by id', type: Expense })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'Expense exist but not in this account',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
  ) {
    return this.expensesService.findOne(id, idAccount);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Expense updated', type: Expense })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description:
      'Expense exist but not in this account, or user doesnt have permission to update this expense',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @GetUser('id') userId: string,
  ) {
    return this.expensesService.update(id, updateExpenseDto, idAccount, userId);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Expense deleted', type: Expense })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description:
      'Expense exist but not in this account, or user doesnt have permission to update this expense',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @GetUser('id') userId: string,
  ) {
    return this.expensesService.remove(id, idAccount, userId);
  }

  @Post('payInstallment/:idCreditPayment')
  @ApiCreatedResponse({
    description: 'Expense created for pay installment',
    type: Expense,
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiNotFoundResponse({
    description:
      'User cant access to credit_payment because account doesnt exist, user dont have permission, credit_expense doesnt exist or credit_expense was deleted',
  })
  payInstallment(
    @Param('idCreditPayment') idCreditPayment: string,
    @Body() payInstallmentDto: PayInstallmentDto,
  ) {
    return this.expensesService.payInstallment(
      idCreditPayment,
      payInstallmentDto,
    );
  }
}
