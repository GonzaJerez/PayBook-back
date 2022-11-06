import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {validate as validateUUID} from 'uuid'

import {Account} from '../accounts/entities/account.entity';
import {Category} from '../categories/entities/category.entity';
import {Subcategory} from '../subcategories/entities/subcategory.entity';
import {User} from '../users/entities/user.entity';
import {CreateExpenseDto} from './dto/create-expense.dto';
import {UpdateExpenseDto} from './dto/update-expense.dto';
import {Expense} from './entities/expense.entity';
import {daysNames} from './utils/days-names';
import {FiltersExpensesDto} from './dto/filters-expenses.dto';
import {getNumberOfWeek} from '../common/helpers/getNumberOfWeek';
import {PaginationDto} from '../common/dtos/pagination.dto';
import {CreditPaymentsService} from '../credit_payments/credit_payments.service';
import {PayInstallmentDto} from './dto/pay-installment.dto';

@Injectable()
export class ExpensesService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    private readonly creditPaymentsService: CreditPaymentsService
  ) {}

  async create(createExpenseDto: CreateExpenseDto, idAccount: string, user: User) {

    const currentDate = new Date(createExpenseDto.complete_date);
    const num_date = currentDate.getDate()
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const day_name = daysNames[currentDate.getDay()];
    const category = await this.findCategory(createExpenseDto.categoryId);
    const subcategory = await this.findSubcategory(createExpenseDto.subcategoryId, category);
    const account = await this.findAccount(idAccount);

    try {
      const expense = this.expenseRepository.create({
        ...createExpenseDto,
        num_date,
        month,
        year,
        day_name,
        category,
        subcategory,
        account,
        user,
        week: getNumberOfWeek(),
      })

      if (createExpenseDto.installments && createExpenseDto.installments > 1) {
        const credit_payment = await this.creditPaymentsService.create({
          account,
          category,
          subcategory,
          user,
          expense,
          installments: createExpenseDto.installments,
          name: createExpenseDto.name_credit_payment
        })

        expense.credit_payment = credit_payment
      }


      await this.expenseRepository.save(expense);

      return {expense};

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async findAll(idAccount: string, queryParameters: PaginationDto) {

    const {limit = 5, skip = 0} = queryParameters;
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')

    try {
      let [expenses, totalExpenses] = await queryBuilder
        .where({
          account: idAccount,
        })
        .skip(skip)
        .limit(limit)
        .leftJoinAndSelect('expense.user', 'user')
        .leftJoinAndSelect('expense.category', 'category')
        .leftJoinAndSelect('expense.subcategory', 'subcategory')
        .leftJoinAndSelect('expense.credit_payment', 'credit_payment')
        .orderBy('expense.complete_date', 'DESC')
        .getManyAndCount()

      return {
        totalExpenses,
        limit,
        skip,
        expenses,
      }

    } catch (error) {
      this.handleExceptions(error)
    }
  }


  async findPrincipalAmounts(idAccount: string) {
    // const queryBuilder = this.expenseRepository.createQueryBuilder('expenses')

    const currentDate = new Date()

    try {

      const [totalAmountOnMonth, totalAmountOnWeek, totalAmountOnDay, fixedCostsMonthly] = await Promise.all([
        await this.expenseRepository
          .createQueryBuilder('expenses')
          .select('SUM(expenses.amount)', 'totalAmountOnMonth')
          .where({
            account: idAccount,
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          })
          .getRawOne(),
        await this.expenseRepository
          .createQueryBuilder('expenses')
          .select('SUM(expenses.amount)', 'totalAmountOnWeek')
          .where({
            account: idAccount,
            week: getNumberOfWeek(),
            year: currentDate.getFullYear()
          })
          .getRawOne(),
        await this.expenseRepository
          .createQueryBuilder('expenses')
          .select('SUM(expenses.amount)', 'totalAmountOnDay')
          .where({
            account: idAccount,
            num_date: currentDate.getDate(),
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          })
          .getRawOne(),
        await this.expenseRepository
          .createQueryBuilder('expenses')
          .leftJoin('expenses.subcategory', 'subcat')
          .select('DISTINCT ON (subcat) subcat.name, expenses.amount amount')
          .leftJoin('expenses.category', 'cat')
          .where(`expenses.accountId=:idAccount AND cat.name=:nameCategory`, {
            idAccount,
            nameCategory: 'Gastos fijos'
          })
          .orderBy('subcat, amount', 'DESC')
          .getRawMany()
      ])


      let totalAmountFixedCostsMonthly = 0
      fixedCostsMonthly.forEach(el => {
        totalAmountFixedCostsMonthly += el.amount
      })

      return {
        ...totalAmountOnMonth,
        ...totalAmountOnWeek,
        ...totalAmountOnDay,
        totalAmountFixedCostsMonthly
      }

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async statistics(idAccount: string, filters: FiltersExpensesDto) {

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
    const {conditions, params, accumulateBy} = this.filterExpenses(filters, idAccount)

    try {
      let expenses = await queryBuilder
        .leftJoinAndSelect('expense.user', 'user')
        .leftJoinAndSelect('expense.category', 'category')
        .leftJoinAndSelect('expense.subcategory', 'subcategory')
        .where(conditions, params)
        .getMany()

      const expensesForMonthInLastYear = await this.totalAmountsForMonthInLastYear(idAccount)

      const {
        totalAmount,
        totalAmountsForCategories,
        totalAmountsForSubcategories
      } = this.calculateAmounts(expenses, accumulateBy)

      return {
        expenses,
        totalAmount,
        totalAmountsForCategories,
        totalAmountsForSubcategories,
        expensesForMonthInLastYear
      };

    } catch (error) {
      console.log(error);
      
      this.handleExceptions(error)
    }
  }

  async findOne(id: string, idAccount: string) {

    try {
      const expense = await this.expenseRepository.findOneBy({id})

      if (!expense)
        this.handleExceptions({
          status: 404,
          message: `Doesnt exist expense with id "${id}"`
        })

      if (expense.account.id !== idAccount)
        this.handleExceptions({
          status: 403,
          message: `Doesnt exist expensive in this account`
        })

      return expense;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, idAccount: string, userId: string) {

    // Recupera gasto a actualizar
    const expenseToUpdate = await this.findOne(id, idAccount)

    // Recupera cuenta actual
    const account = await this.findAccount(idAccount)

    // Validacion del usuario antes de actualizar
    this.isValidUserToModify(userId, expenseToUpdate, account)

    // Desestructuracion del body enviado por cliente
    const {categoryId, subcategoryId, complete_date, ...rest} = updateExpenseDto;

    const currentDate = new Date(complete_date);
    const num_date = currentDate.getDate()
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const day_name = daysNames[currentDate.getDay()];

    // Si se quiere actualizar la categoria recupera la nueva, sino toma la categoria de gasto actual
    const category = (categoryId)
      ? await this.findCategory(categoryId)
      : expenseToUpdate.category

    // Si se quiere actualizar la subcategoria recupera la nueva, sino toma la categoria de gasto actual
    const subcategory = (categoryId)
      ? await this.findSubcategory(subcategoryId, category)
      : expenseToUpdate.subcategory

    // Nuevo gasto con valores actualizado
    const expenseUpdated: Expense = {
      ...expenseToUpdate,
      ...rest,
      category,
      subcategory,
      complete_date,
      num_date,
      month,
      year,
      day_name
    }

    try {

      await this.expenseRepository.save(expenseUpdated)
      return {
        expense: expenseUpdated
      };

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async remove(id: string, idAccount: string, userId: string) {

    // Recupera gasto a eliminar
    const expense = await this.findOne(id, idAccount)

    // Recupera cuenta actual
    const account = await this.findAccount(idAccount)

    // Validacion del usuario antes de eliminar
    this.isValidUserToModify(userId, expense, account)

    try {
      await this.expenseRepository.remove(expense)

      return {
        statusCode: 200,
        message: `Expense deleted successfully`,
        expense
      };

    } catch (error) {
      this.handleExceptions(error)
    }
  }


  async payInstallment(idCreditPayment:string, payInstallmentDto:PayInstallmentDto){
    const {credit_payment} = await this.creditPaymentsService.findOne(idCreditPayment)

    const category = credit_payment.category;
    const subcategory = credit_payment.subcategory;
    const account = credit_payment.account;
    const user = credit_payment.user;

    const currentDate = new Date(payInstallmentDto.complete_date);
    const num_date = currentDate.getDate()
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const day_name = daysNames[currentDate.getDay()];

    const expense = this.expenseRepository.create({
      ...payInstallmentDto,
      num_date,
      month,
      year,
      day_name,
      category,
      subcategory,
      account,
      user,
      week: getNumberOfWeek(),
    })

    expense.credit_payment = credit_payment

    await this.creditPaymentsService.payInstallment(credit_payment)
    await this.expenseRepository.save(expense)
    
    return {expense}
  }

  /**
   * Valida que solo puedan modificar el user que creo el gasto o el admin del grupo
   * @param userId id de usuario autenticado
   * @param expense gasto a modificar
   * @param account cuenta del gasto
   */
  private isValidUserToModify(userId: string, expense: Expense, account: Account) {
    if (expense.user.id !== userId && account.admin_user.id !== userId)
      throw new ForbiddenException(`User doesnt have permission to do this action`)
  }

  private async findCategory(idCategory: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: {id: idCategory}
      })

      if (!category || !category.isActive)
        this.handleExceptions({
          status: 404,
          message: `Invalid category: Doesnt exist category with id "${idCategory}"`
        })

      return category;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private async findSubcategory(idSubcategory: string, category: Category) {
    try {
      const subcategory = await this.subcategoryRepository.findOne({
        where: {id: idSubcategory},
        relations: {category: true}
      })

      if (!subcategory || !subcategory.isActive)
        this.handleExceptions({
          status: 404,
          message: `Invalid subcategory: Doesnt exist subcategory with id "${idSubcategory}"`
        })

      if (subcategory.category.id !== category.id)
        this.handleExceptions({
          status: 400,
          message: `Subcategory "${subcategory.name}" doesnt exist in category "${category.name}"`
        })

      delete subcategory.category

      return subcategory;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private async findAccount(idAccount: string) {
    try {
      const account = await this.accountRepository.findOne({
        where: {id: idAccount},
        relations: {expenses: true, admin_user: true}
      })

      return account;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private filterExpenses(filters: FiltersExpensesDto, idAccount: string) {

    const currentDate = new Date()

    const {
      categories,
      day_name,
      month = [currentDate.getMonth() + 1],
      max_amount,
      min_amount,
      num_date,
      subcategories,
      users,
      year = [currentDate.getFullYear()],
    } = filters;

    // No puede solicitarse subcategorias sin categoria
    if (subcategories && !categories)
      throw new BadRequestException(`For choose subcategory first choose category`)


    // Que valores son los que va a ir acumulando para sumar
    const accumulateBy: "subcategories" | "categories" =
      ((categories && categories.length === 1) || subcategories)
        ? 'subcategories'
        : 'categories'


    return {
      conditions: `
        expense.account=:idAccount 
        ${(categories && categories.length > 0) ? 'AND expense.category IN (:...categories)' : ''}
        ${(day_name && day_name.length > 0) ? 'AND expense.day_name IN (:...day_name)' : ''}
        ${(month.length > 0) ? 'AND expense.month IN (:...month)' : ''}
        ${(max_amount) ? 'AND expense.amount<:max_amount' : ''}
        ${(min_amount) ? 'AND expense.amount>:min_amount' : ''}
        ${(num_date && num_date.length > 0) ? 'AND expense.num_date IN (:...num_date)' : ''}
        ${(subcategories && subcategories.length > 0) ? 'AND expense.subcategory IN (:...subcategories)' : ''}
        ${(users && users.length > 0) ? 'AND expense.user IN (:...users)' : ''}
        ${(year.length > 0) ? 'AND expense.year IN (:...year)' : ''}
      `,
      params: {
        idAccount,
        categories,
        day_name,
        month,
        max_amount,
        min_amount,
        num_date,
        subcategories,
        users,
        year,
      },
      accumulateBy
    }

  }

  private calculateAmounts(expenses: Expense[], filter: 'categories' | 'subcategories') {

    let totalAmount = 0
    let totalAmountsForCategories: {[x: string]: number} = {}
    let totalAmountsForSubcategories: {[x: string]: number} = {}

    expenses.forEach(expense => {

      if (filter === 'categories') {

        const nameCategory = expense.category.name

        if (totalAmountsForCategories[nameCategory]) {
          totalAmountsForCategories[nameCategory] += expense.amount
        } else {
          totalAmountsForCategories[nameCategory] = expense.amount
        }
      }

      if (filter === 'subcategories') {

        const nameSubcategory = expense.subcategory.name

        if (totalAmountsForSubcategories[nameSubcategory]) {
          totalAmountsForSubcategories[nameSubcategory] += expense.amount
        } else {
          totalAmountsForSubcategories[nameSubcategory] = expense.amount
        }
      }

      totalAmount += expense.amount

    })


    return {
      totalAmount,
      totalAmountsForCategories,
      totalAmountsForSubcategories
    }
  }

  private async totalAmountsForMonthInLastYear(idAccount: string): Promise<{month: number; totalAmount: number;}[]> {

    const actualTime = Date.now()
    const oneYearTime = 1000 * 60 * 60 * 24 * 365

    return await this.expenseRepository.createQueryBuilder('expenses')
      .select('expenses.month', 'month')
      .addSelect('SUM(expenses.amount)', 'totalAmount')
      .where(`expenses.accountId=:idAccount AND :yearMiliseconds < expenses.complete_date`, {idAccount, yearMiliseconds: (actualTime - oneYearTime)})
      .groupBy('month')
      .getRawMany<{month: number; totalAmount: number;}>()
  }

  private handleExceptions(error: any) {

    if (error.status === 404)
      throw new NotFoundException(error.message);

    if (error.status === 403)
      throw new ForbiddenException(error.message);

    if (error.status === 400)
      throw new BadRequestException(error.message);


    this.logger.error(error)
    throw new InternalServerErrorException(error)

  }
}
