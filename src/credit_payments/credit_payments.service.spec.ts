import { Test, TestingModule } from '@nestjs/testing';
import { CreditPaymentsService } from './credit_payments.service';

describe('CreditPaymentsService', () => {
  let service: CreditPaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditPaymentsService],
    }).compile();

    service = module.get<CreditPaymentsService>(CreditPaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
