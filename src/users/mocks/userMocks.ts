import { UpdateUserDto } from '../dtos/update-user.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { LoginUserDto } from '../../auth/dto/login-user.dto';
import { PASSWORD_TEST, user1 } from '../../seed/mocks/seedMock';

export const mockToCreateUser: CreateUserDto = {
  email: 'user-test@gmail.com',
  fullName: 'Test1',
  password: PASSWORD_TEST,
};

export const mockToCreateUser2: CreateUserDto = {
  email: 'user-test2@gmail.com',
  fullName: 'Test1',
  password: PASSWORD_TEST,
};

export const mockToCreateAdmin: CreateUserDto = {
  email: 'admin-test@gmail.com',
  password: PASSWORD_TEST,
  fullName: 'Admin',
};

export const fakeUUID = '64cb3f76-b1cc-4add-8af7-584c5cee55b7';

export const fakeTokenGoogle = {
  tokenGoogle:
    '64cb3f76-b1cc-4add-8af7-584c5cee55b7n456nek5f.apps.googleusercontent.com',
};

export const mockUserToUpdateName: UpdateUserDto = {
  fullName: 'Testing',
};

export const mockUserToUpdateEmail: UpdateUserDto = {
  email: 'email_updated@gmail.com',
};

export const mockUserToUpdatePassword: UpdateUserDto = {
  password: PASSWORD_TEST,
  newPassword: `${PASSWORD_TEST}abc`,
};

export const mockUser1ToLogin: LoginUserDto = {
  email: user1.email,
  password: PASSWORD_TEST,
};
