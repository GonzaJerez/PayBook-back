import { Test, TestingModule } from '@nestjs/testing';
import { CreditPaymentsController } from './credit_payments.controller';
import { CreditPaymentsService } from './credit_payments.service';

describe('CreditPaymentsController', () => {
  let controller: CreditPaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditPaymentsController],
      providers: [CreditPaymentsService],
    }).compile();

    controller = module.get<CreditPaymentsController>(CreditPaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
