import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {validate as validateUUID} from 'uuid'

import {Account} from '../accounts/entities/account.entity';
import {Category} from '../categories/entities/category.entity';
import {Subcategory} from '../subcategories/entities/subcategory.entity';
import {User} from '../users/entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {Expense} from './entities/expense.entity';
import {daysNames} from './utils/days-names';
import {FiltersExpensesDto} from './dto/filters-expenses.dto';
import {getNumberOfWeek} from '../common/helpers/getNumberOfWeek';

@Injectable()
export class ExpensesService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository:Repository<Expense>,
    @InjectRepository(Account)
    private readonly accountRepository:Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository:Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository:Repository<Subcategory>,
  ){}

  async create(createExpenseDto: CreateExpenseDto, idAccount:string, user:User) {

    const dateInMiliseconds = new Date(createExpenseDto.complete_date);
    const num_date = dateInMiliseconds.getDate()
    const month = dateInMiliseconds.getMonth() + 1;
    const year = dateInMiliseconds.getFullYear();
    const day_name = daysNames[dateInMiliseconds.getDay() - 1];
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
        week: getNumberOfWeek()
      })

      await this.expenseRepository.save(expense);

      return expense;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async findAllOnMonth(idAccount:string){
    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
    
    const currentDate = new Date()

    try {
      let expenses = await queryBuilder.where({
        account: idAccount,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      })
      .leftJoinAndSelect('expense.user','user')
      .leftJoinAndSelect('expense.category','category')
      .leftJoinAndSelect('expense.subcategory','subcategory')
      .getMany()

      let totalAmountOnMonth = 0;
      let totalAmountOnWeek = 0;
      let totalAmountOnDay = 0;

      // TODO: Costos mensuales agregarlo como prop de cuenta
      // let totalFixedCostsMonthly = 0;

      const actualWeek = getNumberOfWeek()
      
      expenses.forEach( expense =>{
        
        if(expense.week === actualWeek){
          totalAmountOnWeek += expense.amount
        }
        if(expense.num_date === currentDate.getDate()){
          totalAmountOnDay += expense.amount
        }

        totalAmountOnMonth += expense.amount
      })

      return {
        expenses,
        totalAmountOnMonth,
        totalAmountOnWeek,
        totalAmountOnDay
      }

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async statistics(idAccount:string, queryParameters:FiltersExpensesDto){

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense')
    const {conditions,params, accumulateBy} = this.filterExpenses(queryParameters, idAccount)

    try {
      let expenses = await queryBuilder
        .leftJoinAndSelect('expense.user','user')
        .leftJoinAndSelect('expense.category','category')
        .leftJoinAndSelect('expense.subcategory','subcategory')
        .where(conditions,params)
        .getMany()

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
      };

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async findOne(id: string, idAccount:string) {

    try {
      const expense = await this.expenseRepository.findOneBy({id})

      if(!expense)
        this.handleExceptions({
          status: 404,
          message: `Doesnt exist expense with id "${id}"`
        })
      
        if(expense.account.id !== idAccount)
          this.handleExceptions({
            status: 403,
            message: `Doesnt exist expensive in this account`
          })

      return expense;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, idAccount:string, userId:string) {

    // Recupera gasto a actualizar
    const expenseToUpdate = await this.findOne(id, idAccount)

    // Recupera cuenta actual
    const account = await this.findAccount(idAccount)

    // Validacion del usuario antes de actualizar
    this.isValidUserToModify(userId, expenseToUpdate, account)

    // Desestructuracion del body enviado por cliente
    const {categoryId,subcategoryId, ...rest} = updateExpenseDto;

    // Si se quiere actualizar la categoria recupera la nueva, sino toma la categoria de gasto actual
    const category = (categoryId)
      ? await this.findCategory(categoryId)
      : expenseToUpdate.category

    // Si se quiere actualizar la subcategoria recupera la nueva, sino toma la categoria de gasto actual
    const subcategory = (categoryId)
      ? await this.findSubcategory(subcategoryId, category)
      : expenseToUpdate.subcategory

    // Nuevo gasto con valores actualizado
    const expenseUpdated:Expense = {
      ...expenseToUpdate,
      ...rest,
      category,
      subcategory
    }
    
    try {

      await this.expenseRepository.save(expenseUpdated)
      return expenseUpdated;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async remove(id: string, idAccount:string, userId:string) {

    // Recupera gasto a eliminar
    const expense = await this.findOne(id, idAccount)

    // Recupera cuenta actual
    const account = await this.findAccount(idAccount)

    // Validacion del usuario antes de eliminar
    this.isValidUserToModify(userId, expense, account)

    try {
      await this.expenseRepository.remove(expense)

      return {
        ok: true,
        message: `Expense deleted successfully`,
        expense
      };

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**
   * Valida que solo puedan eliminar el user que creo el gasto o el admin del grupo
   * @param userId id de usuario autenticado
   * @param expense gasto a eliminar
   * @param account cuenta del gasto
   */
  private isValidUserToModify(userId:string, expense:Expense, account:Account){
    if(expense.user.id !== userId && account.admin_user.id !== userId )
      throw new ForbiddenException(`User doesnt have permission to do this action`)
  }

  private async findCategory(idCategory:string){
    try {
      const category = await this.categoryRepository.findOne({
        where: {id:idCategory}
      })

      if(!category || !category.isActive)
        this.handleExceptions({
          status: 404,
          message: `Invalid category: Doesnt exist category with id "${idCategory}"`
        })

      return category;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private async findSubcategory(idSubcategory:string, category:Category){
    try {
      const subcategory = await this.subcategoryRepository.findOne({
        where: {id:idSubcategory},
        relations: {category:true}
      })

      if(!subcategory || !subcategory.isActive)
        this.handleExceptions({
          status: 404,
          message: `Invalid subcategory: Doesnt exist subcategory with id "${idSubcategory}"`
        })

      if(subcategory.category.id !== category.id)
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

  private async findAccount(idAccount:string){
    try {
      const account = await this.accountRepository.findOne({
        where: {id:idAccount},
        relations: {expenses:true, admin_user:true}
      })

      return account;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private filterExpenses(filters:FiltersExpensesDto, idAccount:string){

    const currentDate = new Date()

    const {
      categories,
      day_name,
      month = currentDate.getMonth() + 1,
      max_amount,
      min_amount,
      monthly,
      num_date,
      subcategories,
      users,
      year = currentDate.getFullYear(),
      yearly,
    } = filters;

    // No puede solicitarse subcategorias sin categoria
    if(subcategories && !categories)
      throw new BadRequestException(`For choose subcategorie first choose categorie`)

    // Creo array de ids por cada query recibida
    const arrayCategoriesIds = categories?.split(' ')
    const arraySubcategoriesIds = subcategories?.split(' ')
    const arrayUsersIds = users?.split(' ')
    
    // Valido que cada array creado contenga uuid's
    arrayCategoriesIds?.map(cat => {
      if(!validateUUID(cat)) throw new BadRequestException(`some idCategory is not a valid uuid`)
    })
    arraySubcategoriesIds?.map(subcat => {
      if(!validateUUID(subcat)) throw new BadRequestException(`some idSubcategory is not a valid uuid`)
    })
    arrayUsersIds?.map(user => {
      if(!validateUUID(user)) throw new BadRequestException(`some isUser is not a valid uuid`)
    })

    // Que valores son los que va a ir acumulando para sumar
    const accumulateBy: "subcategories" | "categories" = 
        ((categories && arrayCategoriesIds.length === 1) || subcategories) 
          ? 'subcategories'
          : 'categories'


    return {
      conditions: `
        expense.account=:idAccount 
        ${(categories) ? 'AND expense.category IN (:...categories)' : ''}
        ${(day_name) ? 'AND expense.day_name=:day_name' : ''}
        ${(month !== 0) ? 'AND expense.month=:month' : ''}
        ${(max_amount) ? 'AND expense.amount<:max_amount' : ''}
        ${(min_amount) ? 'AND expense.amount>:min_amount' : ''}
        ${(monthly) ? 'AND expense.monthly=:monthly' : ''}
        ${(num_date) ? 'AND expense.num_date=:num_date' : ''}
        ${(subcategories) ? 'AND expense.subcategory IN (:...subcategories)' : ''}
        ${(users) ? 'AND expense.users IN (:...users)' : ''}
        ${(year !== 0) ? 'AND expense.year=:year' : ''}
        ${(yearly) ? 'AND expense.yearly=:yearly' : ''}
      `,
      params: {
        idAccount,
        categories: (categories) && arrayCategoriesIds,
        day_name,
        month,
        max_amount,
        min_amount,
        monthly,
        num_date,
        subcategories: (subcategories) && arraySubcategoriesIds,
        users: (users) && arrayUsersIds,
        year,
        yearly
      },
      accumulateBy
    }

  }

  private calculateAmounts(expenses:Expense[], filter:'categories'|'subcategories'){

    let totalAmount = 0
    let totalAmountsForCategories:{[x:string]: number} = {}
    let totalAmountsForSubcategories:{[x:string]: number} = {}

    expenses.forEach(expense => {

      if (filter === 'categories') {

        const nameCategory = expense.category.name

        if (totalAmountsForCategories[nameCategory]) {
          totalAmountsForCategories[nameCategory] += expense.amount
        } else{
          totalAmountsForCategories[nameCategory] = expense.amount
        }
      }

      if (filter === 'subcategories') {

        const nameSubcategory = expense.subcategory.name

        if (totalAmountsForSubcategories[nameSubcategory]) {
          totalAmountsForSubcategories[nameSubcategory] += expense.amount
        } else{
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

  private handleExceptions(error:any){

    if(error.status === 404)
      throw new NotFoundException(error.message);

    if(error.status === 403)
      throw new ForbiddenException(error.message);

    if(error.status === 400)
      throw new BadRequestException(error.message);
      

    this.logger.error(error)
    throw new InternalServerErrorException(error)
    
  }
}
