import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import {GetUser} from '../auth/decorators/get-user.decorator';
import {User} from '../users/entities/user.entity';
import {ValidUserToAccessAccount} from '../common/decorators/valid-user-to-access-account.decorator';
import { CreditPaymentsService } from './credit_payments.service';
import { CreateCreditPaymentDto } from './dto/create-credit_payment.dto';
import { UpdateCreditPaymentDto } from './dto/update-credit_payment.dto';

@Controller('accounts/:idAccount/credit-payments')
@ValidUserToAccessAccount()
export class CreditPaymentsController {
  constructor(private readonly creditPaymentsService: CreditPaymentsService) {}

  // @Post()
  // create(@Body() createCreditPaymentDto: CreateCreditPaymentDto) {
  //   return this.creditPaymentsService.create(createCreditPaymentDto);
  // }

  @Get()
  findAll( @Param('idAccount', ParseUUIDPipe) idAccount:string) {
    return this.creditPaymentsService.findAll(idAccount);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.creditPaymentsService.findOne(+id);
  // }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Param('idAccount', ParseUUIDPipe) idAccount: string, 
    @Body() updateCreditPaymentDto: UpdateCreditPaymentDto,
    @GetUser() user:User
  ) {
    return this.creditPaymentsService.update(id, updateCreditPaymentDto, user, idAccount);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idAccount', ParseUUIDPipe) idAccount: string,
    @GetUser() user: User
  ) {
    return this.creditPaymentsService.remove(id, user, idAccount);
  }
}
