import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'

import {AuthService} from '../auth/auth.service';
import {ValidRoles} from '../auth/interfaces';
import {PaginationDto} from '../common/dtos/pagination.dto';
import {Repository} from 'typeorm';
import {CreateUserDto} from './dtos/create-user.dto';
import {UpdateUserDto} from './dtos/update-user.dto';
import {User} from './entities/user.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Account} from '../accounts/entities/account.entity';
import {generateAccountAccessKey} from '../common/helpers/generateAccountAccessKey';
import {defaultAccount} from '../accounts/data/default-account';
import {Category} from '../categories/entities/category.entity';
import {defaultCategories} from '../categories/data/default-categories';
import {Subcategory} from '../subcategories/entities/subcategory.entity';

@Injectable()
export class UsersService extends AuthService {

  constructor(
    userRepository: Repository<User>,
    jwtService: JwtService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {
    super(userRepository, jwtService)
  }

  async create(createAuthDto: CreateUserDto) {

    const {password, ...rest} = createAuthDto;

    try {
      // Creo user
      const user = this.userRepository.create({
        ...rest,
        password: bcrypt.hashSync(password, 10),
      });

      // Creo cuenta por defecto para el usuario creado
      const account = this.accountRepository.create({
        ...defaultAccount,
        access_key: generateAccountAccessKey(),
        // Creo categorias por defecto para la cuenta creada
        categories: this.categoryRepository.create(
          defaultCategories.map(cat => ({
            name:cat.name,
            // Creo subcategorias por defecto para cada categoria creada
            subcategories: this.subcategoryRepository.create(
              cat.subcategories.map( subcat => ({
                name: subcat
              }))
            )
          }))
        )
      });

      user.accounts = [account]
      user.accounts_admin = [account]
      user.accounts_owner = [account]

      await this.userRepository.save(user)
      
      delete user.password;
      delete user.accounts_admin
      delete user.accounts_owner

      return {
        ...user,
        token: this.generateToken({id: user.id})
      };

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(queryParameters: PaginationDto) {
    const {limit = 10, skip = 0} = queryParameters;
    try {
      const [users, totalUsers] = await this.userRepository.findAndCount({
        take: limit,
        skip: skip,
      });

      return {
        totalUsers,
        limit,
        skip: skip,
        users,
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(id: string, user?: User) {

    if (user)
      this.isAuthUser(user, id);

    try {
      const user = await this.userRepository.findOne({
        where: {id},
        relations: {accounts: true, accounts_admin: true, accounts_owner: true}
      })

      if (!user) this.handleExceptions({
        ok: false,
        message: `User with id ${id} not found`
      });

      // Para no retornar las cuentas inactivas
      user.accounts = user.accounts.filter(account => account.isActive)
      user.accounts_admin = user.accounts_admin.filter(account => account.isActive)
      user.accounts_owner = user.accounts_owner.filter(account => account.isActive)

      return user
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async reactivate(id: string) {

    const {accounts, accounts_admin, accounts_owner, ...user} = await this.findOne(id);
    user.isActive = true;

    try {
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: User) {

    this.isAuthUser(user, id);

    try {
      const userUpdated = await this.userRepository.preload({
        id,
        ...updateUserDto,
      })

      if (!userUpdated) this.handleExceptions({
        ok: false,
        message: `User with id ${id} not found`
      });

      await this.userRepository.save(userUpdated)

      return {
        ...userUpdated,
        // accounts: user.accounts
      }

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string, userAuth: User) {

    const {accounts, accounts_admin, accounts_owner, ...user} = await this.findOne(id, userAuth);
    user.isActive = false;

    try {
      await this.userRepository.save(user);

      return user;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async becomePremium(user: User) {

    // TODO: Implementacion de pago

    user.roles = [ValidRoles.USER_PREMIUM]

    await this.userRepository.save(user)

    return user;
  }

  /**
   * Valida que sea el mismo usuario que se quiere modificar o un admin
   * @param userAuth User que realiza la peticion
   * @param userModifiedId User a modificar
   */
  private isAuthUser(userAuth: User, userModifiedId: string) {
    if (userAuth.id !== userModifiedId && !userAuth.roles.includes(ValidRoles.ADMIN)) {
      throw new ForbiddenException(`You don't have permission to perform this action`)
    }
  }

  handleExceptions(error: any) {

    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if (error.message === 'Already exist an Admin') {
      throw new ForbiddenException(error.message)
    }

    if (error.message.startsWith('User with id ')) {
      throw new NotFoundException(error.message)
    }

    if (error.message === 'Credentials are not valid') {
      throw new UnauthorizedException(error.message)
    }

    this.logger.error(error);

    throw new InternalServerErrorException('Mensaje de error')
  }
}
