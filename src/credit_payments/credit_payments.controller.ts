import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ValidUserToAccessAccount } from '../common/decorators/valid-user-to-access-account.decorator';
import { CreditPaymentsService } from './credit_payments.service';
import { UpdateCreditPaymentDto } from './dto/update-credit_payment.dto';
import { OnlyPendingDto } from './dto/only-pending.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreditPayment } from './entities/credit_payment.entity';

@ApiTags('Credit Payments')
@Controller('accounts/:idAccount/credit-payments')
@ApiBearerAuth()
@ApiNotFoundResponse({
  description:
    'User cant access to credit_expense because account doesnt exist, user dont have permission, credit_expense doesnt exist or credit_expense was deleted',
})
@ValidUserToAccessAccount()
export class CreditPaymentsController {
  constructor(private readonly creditPaymentsService: CreditPaymentsService) {}

  @Get(':id')
  @ApiOkResponse({
    description: 'Credit_payment by Id',
    type: [CreditPayment],
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findOne(@Param('id', ParseUUIDPipe) idCreditPayment: string) {
    return this.creditPaymentsService.findOne(idCreditPayment);
  }

  @Get()
  @ApiOkResponse({
    description: 'List of credit_payments',
    type: [CreditPayment],
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  findAll(
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @Query() onlyPendingDto: OnlyPendingDto,
  ) {
    return this.creditPaymentsService.findAll(idAccount, onlyPendingDto);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: 'credit_payment updated',
    type: CreditPayment,
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'User doesnt have sufficient permission',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @Body() updateCreditPaymentDto: UpdateCreditPaymentDto,
    @GetUser() user: User,
  ) {
    return this.creditPaymentsService.update(
      id,
      updateCreditPaymentDto,
      user,
      idAccount,
    );
  }

  @Delete(':id')
  @ApiOkResponse({
    description: 'credit_payment deleted',
    type: CreditPayment,
  })
  @ApiBadRequestResponse({ description: 'Some prop is incorrect' })
  @ApiForbiddenResponse({
    description: 'User doesnt have sufficient permission',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @GetUser() user: User,
  ) {
    return this.creditPaymentsService.remove(id, user, idAccount);
  }
}
