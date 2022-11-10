import * as bcrypt from 'bcrypt';

import { CreateSubcategoryDto } from 'src/subcategories/dto/create-subcategory.dto';
import { CreateAccountDto } from '../../accounts/dto/create-account.dto';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto';
import { CreateUserDto } from '../../users/dtos/create-user.dto';

export const PASSWORD_TEST = 'Abcd1234';

// ADMIN
export const adminTest: CreateUserDto = {
  email: 'admin@gmail.com',
  password: bcrypt.hashSync(PASSWORD_TEST, 10),
  fullName: 'Admin',
};

// USERS
export const user1: CreateUserDto = {
  email: 'test@gmail.com',
  fullName: 'Test',
  password: bcrypt.hashSync(PASSWORD_TEST, 10),
};

export const user2: CreateUserDto = {
  email: 'test2@gmail.com',
  fullName: 'Test2',
  password: bcrypt.hashSync(PASSWORD_TEST, 10),
};

export const user3: CreateUserDto = {
  email: 'test3@gmail.com',
  fullName: 'Test3',
  password: bcrypt.hashSync(PASSWORD_TEST, 10),
};

// ACCOUNTS
export const account1: CreateAccountDto = {
  name: 'testAccount',
  description: 'This is an description',
  max_num_users: 2,
};

export const account2: CreateAccountDto = {
  name: 'testAccount2',
  description: 'This is an description',
  max_num_users: 1,
};

export const account3: CreateAccountDto = {
  name: 'testAccount3',
  description: 'This is an description',
};

// CATEGORIES
export const category1: CreateCategoryDto = {
  name: 'Gastos fijos',
};

export const category2: CreateCategoryDto = {
  name: 'Categoria seed 2',
};

export const category3: CreateCategoryDto = {
  name: 'Categoria seed 3',
};

// SUBCATEGORIES
export const subcategory1: CreateSubcategoryDto = {
  name: 'Alquiler',
};

export const subcategory2: CreateSubcategoryDto = {
  name: 'Seguro auto',
};

export const subcategory3: CreateSubcategoryDto = {
  name: 'Subcategoria seed 3',
};

export const subcategory4: CreateSubcategoryDto = {
  name: 'Subcategoria seed 4',
};

// EXPENSES
export const expense1 = {
  amount: 1500,
  description: 'Description for expense1',
  complete_date: Date.now(),
};

export const expense2 = {
  amount: 1100,
  description: 'Description for expense2',
  complete_date: new Date('05/11/2021').getTime(),
};

export const expense3 = {
  amount: 600,
  description: 'Description for expense3',
  complete_date: new Date('02/19/2022').getTime(),
};

export const expense4 = {
  amount: 3000,
  description: 'Description for expense4',
  complete_date: new Date('08/31/2020').getTime(),
};
