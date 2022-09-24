import { Test, TestingModule } from '@nestjs/testing';
import { mockCompleteUser } from '../users/mocks/userMocks';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { mockCompleteAccount, mockToCreateAccount, mockToUpdateAccount } from './mocks/accountMocks';

describe('AccountsController', () => {
  let controller: AccountsController;

  const mockAccountsService = {
    create: jest.fn().mockImplementation((createAccountDto:CreateAccountDto)=>(mockCompleteAccount)),
    findAll: jest.fn().mockImplementation(()=>([mockCompleteAccount])),
    findOne: jest.fn().mockImplementation(()=>(mockCompleteAccount)),
    update: jest.fn().mockImplementation(()=>(mockCompleteAccount)),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [AccountsService],
    })
    .overrideProvider(AccountsService)
    .useValue(mockAccountsService)
    .compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('return an account created', () => {
    expect(controller.create).toBeDefined();
    expect(controller.create(mockToCreateAccount, mockCompleteUser)).toEqual(mockCompleteAccount);
  });

  it('return all accounts', () => {
    expect(controller.findAll).toBeDefined();
    expect(controller.findAll({})).toEqual([mockCompleteAccount]);
  });

  it('return one account by id', () => {
    expect(controller.findOne).toBeDefined();
    expect(controller.findOne(mockCompleteAccount.id, mockCompleteUser)).toEqual(mockCompleteAccount);
  });

  it('return updated account', () => {
    expect(controller.update).toBeDefined();
    expect(controller.update(mockCompleteAccount.id,mockToUpdateAccount, mockCompleteUser)).toEqual(mockCompleteAccount);
  });
});
