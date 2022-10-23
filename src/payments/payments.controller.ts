import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {Auth} from '../auth/decorators/auth.decorator';
import {GetUser} from '../auth/decorators/get-user.decorator';
import {User} from '../users/entities/user.entity';

@Auth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user:User
  ) {
    return this.paymentsService.create(createPaymentDto, user);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }
}
