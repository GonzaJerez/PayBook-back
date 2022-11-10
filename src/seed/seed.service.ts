import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { Account } from '../accounts/entities/account.entity';
import { User } from '../users/entities/user.entity';
import {
  adminTest,
  user1,
  user2,
  user3,
  account1,
  account2,
  account3,
  category1,
  category2,
  category3,
  subcategory1,
  subcategory2,
  subcategory3,
  expense1,
  expense2,
  expense3,
  expense4,
  subcategory4,
} from './mocks/seedMock';
import { generateAccountAccessKey } from '../common/helpers/generateAccountAccessKey';
import { ValidRoles } from '../auth/interfaces';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { daysNames } from '../expenses/utils/days-names';
import { getNumberOfWeek } from '../common/helpers/getNumberOfWeek';
import { CreditPayment } from '../credit_payments/entities/credit_payment.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(CreditPayment)
    private readonly creditPaymentsRepository: Repository<CreditPayment>,
    private readonly jwtService: JwtService,
  ) {}

  async executeSeed() {
    try {
      await this.cleanDB();

      // Crear admin
      const admin = this.createAdmin();

      // Crear usuarios
      const users = this.createUsers();

      // Crear cuentas para cada usuario
      const usersWithAccounts = this.createAccountsForEachUser(users);

      // Save all users and admins with their accounts
      await this.userRepository.save([...usersWithAccounts, admin]);

      delete admin.password;

      return {
        message: 'Seed executed',
        users: usersWithAccounts.map((user) => {
          const token = this.jwtService.sign({ id: user.id });
          delete user.password;
          return { ...user, token };
        }),
        admin: {
          ...admin,
          token: this.jwtService.sign({ id: admin.id }),
        },
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async cleanDB() {
    try {
      // Limpiar DB
      await this.expenseRepository.delete({});
      await this.creditPaymentsRepository.delete({});
      await this.subcategoryRepository.delete({});
      await this.categoryRepository.delete({});
      await this.accountRepository.delete({});
      await this.userRepository.delete({});

      return {
        message: 'DB cleaned',
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private createAdmin() {
    return this.userRepository.create({
      ...adminTest,
      roles: [ValidRoles.ADMIN],
    });
  }

  private createUsers() {
    return this.userRepository.create([user1, user2, user3]);
  }

  private createAccountsForEachUser(users: User[]): User[] {
    return users.map((user) => {
      const accounts = this.accountRepository.create([
        {
          ...account1,
          access_key: generateAccountAccessKey(),
        },
        {
          ...account2,
          access_key: generateAccountAccessKey(),
        },
      ]);

      const expenses = this.createExpensesForEachAccount();
      const accountsWithCategories = this.createCategoriesForEachAccount(
        accounts,
        expenses,
      );

      user.accounts = accountsWithCategories;
      user.accounts_admin = accountsWithCategories;
      user.accounts_owner = accountsWithCategories;
      user.expenses = expenses;

      return user;
    });
  }

  private createCategoriesForEachAccount(
    accounts: Account[],
    expenses: Expense[],
  ): Account[] {
    return accounts.map((account, idx) => {
      const categories = this.categoryRepository.create([
        { ...category1 },
        { ...category2 },
        // {...category3},
      ]);

      let filteredExpenses = [];
      let categoriesWithSubcategories = [];

      // Relaciona gastos con cada cuenta
      if (idx === 0) {
        filteredExpenses = expenses.filter((exp, index) => index < 4);
        categoriesWithSubcategories = this.createSubategoriesForEachCategory(
          categories,
          filteredExpenses,
        );
      } else {
        filteredExpenses = expenses.filter((exp, index) => index >= 4);
        categoriesWithSubcategories = this.createSubategoriesForEachCategory(
          categories,
          filteredExpenses,
        );
      }

      account.expenses = filteredExpenses;
      account.categories = categoriesWithSubcategories;

      // account.expenses = (idx === 0)
      //   ? expenses.filter((exp, index) => index < 4)
      //   : expenses.filter((exp, index) => index >= 4)

      return account;
    });
  }

  private createSubategoriesForEachCategory(
    categories: Category[],
    expenses: Expense[],
  ): Category[] {
    return categories.map((cat, idx) => {
      let subcategories = [];

      if (idx === 0) {
        subcategories = this.subcategoryRepository.create([
          { ...subcategory1 },
          { ...subcategory2 },
        ]);
      } else {
        subcategories = this.subcategoryRepository.create([
          { ...subcategory3 },
          { ...subcategory4 },
        ]);
      }

      // Relaciona gastos con cada subcategoria
      if (idx === 0) {
        cat.subcategories = subcategories.map((subcat, idxSubcat) => ({
          ...subcat,
          expenses:
            idxSubcat === 0
              ? expenses.filter((exp, index) => index === 0)
              : expenses.filter((exp, index) => index === 1),
        }));
      } else {
        cat.subcategories = subcategories.map((subcat, idxSubcat) => ({
          ...subcat,
          expenses:
            idxSubcat === 0
              ? expenses.filter((exp, index) => index === 2)
              : expenses.filter((exp, index) => index === 3),
        }));
      }

      // Relaciona gastos con cada categoria
      if (idx === 0) {
        cat.expenses = expenses.filter((exp, index) => index < 2);
      } else {
        cat.expenses = expenses.filter((exp, index) => index >= 2);
      }

      return cat;
    });
  }

  private createExpensesForEachAccount() {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const num_date = currentDate.getDate();
    const year = currentDate.getFullYear();
    const day_name = daysNames[currentDate.getDay()];
    const week = getNumberOfWeek();

    const mocksExpenses = [
      {
        ...expense1,
        day_name,
        month,
        num_date,
        year,
        week,
      },
      {
        ...expense2,
        day_name: 'Martes',
        month: 5,
        num_date: 11,
        year: 2021,
        week: 20,
      },
      {
        ...expense3,
        day_name: 'Martes',
        month: 2,
        num_date: 19,
        year: 2022,
        week: 6,
      },
      {
        ...expense4,
        day_name: 'Martes',
        month: 8,
        num_date: 31,
        year: 2020,
        week: 33,
      },
    ];

    const expenses = this.expenseRepository.create([
      ...mocksExpenses,
      ...mocksExpenses,
    ]);

    return expenses;
  }

  private handleExceptions(error: any) {
    this.logger.error(error);
    console.log(error);

    throw new InternalServerErrorException(error);
  }
}
