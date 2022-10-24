import {ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Account} from '../accounts/entities/account.entity';
import {Repository} from 'typeorm';
import {CreateCreditPaymentDto} from './dto/create-credit_payment.dto';
import {UpdateCreditPaymentDto} from './dto/update-credit_payment.dto';
import {CreditPayment} from './entities/credit_payment.entity';
import {User} from 'src/users/entities/user.entity';
import {OnlyPendingDto} from './dto/only-pending.dto';

@Injectable()
export class CreditPaymentsService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(CreditPayment)
    private readonly creditPaymentRepository: Repository<CreditPayment>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(createCreditPaymentDto: CreateCreditPaymentDto) {
    try {
      const credit_payment = this.creditPaymentRepository.create({
        ...createCreditPaymentDto,
        name: createCreditPaymentDto.name || 'Sin nombre de referencia',
        installments_paid: 1,
      })

      await this.creditPaymentRepository.save(credit_payment)

      return credit_payment;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async findAll(idAccount: string, onlyPendingDto:OnlyPendingDto) {
    try {
      const qb = this.creditPaymentRepository.createQueryBuilder('credit_payment')
      const credit_payments = await qb
        .where(
          `credit_payment.accountId=:idAccount
          AND credit_payment.isActive = true
          ${onlyPendingDto.pending 
            ? 'AND credit_payment.installments != credit_payment.installments_paid'
            : ''
          }`,
          {idAccount}
        )
        .leftJoinAndSelect('credit_payment.expenses', 'credit_payment_expenses')
        .leftJoinAndSelect('credit_payment_expenses.category', 'credit_payment_expenses_category')
        .leftJoinAndSelect('credit_payment_expenses.subcategory', 'credit_payment_expenses_subcategory')
        .leftJoinAndSelect('credit_payment_expenses.user', 'credit_payment_expenses_user')
        .getMany()

      // const creditPaymentsWithAmount = 

      return {credit_payments}
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async findOne(id: string) {
    try {
      const credit_payment = await this.creditPaymentRepository.findOneBy({id})

      if (!credit_payment || !credit_payment.isActive)
        this.handleExceptions({
          status: 404,
          message: `No se encontró credit_payment con el id "${id}"`
        })

      return {credit_payment};

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async payInstallment(credit_payment: CreditPayment) {
    try {
      credit_payment.installments_paid = credit_payment.installments_paid + 1

      await this.creditPaymentRepository.save(credit_payment)

      return {credit_payment}

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateCreditPaymentDto: UpdateCreditPaymentDto, user: User, idAccount: string) {

    const {credit_payment} = await this.findOne(id)
    const account = await this.findAccount(idAccount)

    this.isValidUserToModify(user.id, credit_payment, account)

    const credit_payment_updated = {
      ...credit_payment,
      ...updateCreditPaymentDto
    }

    try {
      await this.creditPaymentRepository.save(credit_payment_updated)
      return {credit_payment: credit_payment_updated}

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async remove(id: string, user:User, idAccount:string) {

    const {credit_payment} = await this.findOne(id)
    const account = await this.findAccount(idAccount)

    this.isValidUserToModify(user.id, credit_payment, account)

    try {
      await this.creditPaymentRepository.remove(credit_payment)
      return {
        ok: true,
        credit_payment
      }
    } catch (error) {
      this.handleExceptions(error)
    }
  }


  /**
   * Valida que solo pueda modificar el user que creo el credit_payment o el admin del grupo
   * @param userId id de usuario autenticado
   * @param credit_payment gasto a modificar
   * @param account cuenta del gasto
   */
  private isValidUserToModify(userId: string, credit_payment: CreditPayment, account: Account) {
    if (credit_payment.user.id !== userId && account.admin_user.id !== userId)
      throw new ForbiddenException(`User doesnt have permission to do this action`)
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

  private handleExceptions(error: any) {

    if (error.status === 404)
      throw new NotFoundException(error.message);

    // if (error.status === 403)
    //   throw new ForbiddenException(error.message);

    // if (error.status === 400)
    //   throw new BadRequestException(error.message);


    this.logger.error(error)
    throw new InternalServerErrorException(error)

  }
}
