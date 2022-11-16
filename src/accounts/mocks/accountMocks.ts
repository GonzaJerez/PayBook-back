import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

export const mockToCreateAccount: CreateAccountDto = {
  name: 'Account test',
  description: 'This is an description',
  max_num_users: 5,
};

export const mockToUpdateAccount: UpdateAccountDto = {
  name: 'TestAccountUpdated',
};

export const fakeAccountUUID = '919b61bc-155a-4f1b-a9b3-89bd5b1a8dbf';
