import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import axios, { Axios } from 'axios';
import { ConfigService } from '@nestjs/config';

import { AuthService } from '../auth/auth.service';
import { ValidRoles } from '../auth/interfaces';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { User } from './entities/user.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { Subcategory } from '../subcategories/entities/subcategory.entity';
import { LoginGoogleDto } from '../auth/dto/login-google.dto';
import { defaultAccount } from '../accounts/data/default-account';
import { generateAccountAccessKey } from '../common/helpers/generateAccountAccessKey';
import { defaultCategories } from '../categories/data/default-categories';
import { PASSWORD_TEST } from '../seed/mocks/seedMock';
import { CreateSubscriptionDto } from './dtos/create-subscription.dto';
import { PasswordRecoveryDto } from './dtos/password-recovery.dto';
import { transporter } from '../common/helpers/nodemailer.config';
import { SecurityCodeDto } from './dtos/security-code.dto';
import { RenewPasswordDto } from './dtos/renew-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger();
  private readonly axios: Axios = axios;
  private readonly transporter = transporter;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    private readonly configService: ConfigService,
  ) {}

  async googleSignIn(loginGoogleDto: LoginGoogleDto) {
    const { tokenGoogle } = loginGoogleDto;
    try {
      const { name, email } = await this.googleVerify(tokenGoogle);
      const dataToCreateUser: CreateUserDto = {
        fullName: name,
        email,
        password: PASSWORD_TEST,
      };

      let user = await this.userRepository.findOneBy({ email });

      if (user && !user.google)
        this.handleExceptions({
          status: 401,
          message: 'El usuario ya se encuentra registrado con el email',
        });

      if (user && !user.isActive)
        this.handleExceptions({
          status: 403,
          message: 'Usuario eliminado. Contactese con soporte',
        });

      if (!user) {
        user = await this.createNewUser(dataToCreateUser, { google: true });
      } else {
        const checkedUser = await this.authService.checkIsPremium(user);
        user = checkedUser.user;
      }

      return {
        user,
        token: this.authService.generateToken({ id: user.id }),
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async register(createUserDto: CreateUserDto) {
    const { email } = createUserDto;

    const existUserWithSameEmail = await this.findUserByEmail(email);

    if (existUserWithSameEmail)
      throw new BadRequestException(
        `Ya se encuentra registrado un usuario con el email "${email}"`,
      );

    const user = await this.createNewUser(createUserDto, { google: false });

    return {
      user,
      token: this.authService.generateToken({ id: user.id }),
    };
  }

  async findAll(queryParameters: PaginationDto) {
    const { limit = 10, skip = 0 } = queryParameters;
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
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(id: string, user?: User) {
    if (user) this.isAuthUser(user, id);

    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          accounts: true,
          accounts_admin: true,
          accounts_owner: true,
        },
      });

      if (!user)
        this.handleExceptions({
          status: 404,
          message: `User with id ${id} not found`,
        });

      // Para no retornar las cuentas inactivas
      user.accounts = user.accounts.filter((account) => account.isActive);
      user.accounts_admin = user.accounts_admin.filter(
        (account) => account.isActive,
      );
      user.accounts_owner = user.accounts_owner.filter(
        (account) => account.isActive,
      );

      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async reactivate(id: string) {
    const { accounts, accounts_admin, accounts_owner, ...user } =
      await this.findOne(id);
    user.isActive = true;

    try {
      await this.userRepository.save(user);

      return { user };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: User) {
    this.isAuthUser(user, id);
    const { email, password, newPassword, ...rest } = updateUserDto;

    try {
      const userToUpdate = await this.userRepository.findOne({
        where: { id },
        select: {
          fullName: true,
          email: true,
          id: true,
          password: true,
          isActive: true,
          roles: true,
          google: true,
        },
        relations: { accounts: true },
      });

      // si user no existe
      if (!userToUpdate)
        this.handleExceptions({
          status: 404,
          message: `User with id ${id} not found`,
        });

      // si actualiza email
      if (email) {
        userToUpdate.email = email.toLowerCase();
      }

      // si actualiza password
      if (password) {
        // Si la contraseña actual es incorrecta y no actualiza el admin
        if (
          !bcrypt.compareSync(password, userToUpdate.password) &&
          !user.roles.includes(ValidRoles.ADMIN)
        ) {
          return this.handleExceptions({
            status: 400,
            message: 'Contraseña actual incorrecta',
          });
        }
        // Si es correcta actualiza
        else {
          userToUpdate.password = bcrypt.hashSync(newPassword, 10);
        }
      }

      const userUpdated = {
        ...userToUpdate,
        ...rest,
      };

      await this.userRepository.save(userUpdated);

      return {
        user: userUpdated,
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string, userAuth: User) {
    const { accounts, accounts_admin, accounts_owner, ...user } =
      await this.findOne(id, userAuth);
    user.isActive = false;

    try {
      await this.userRepository.save(user);

      return { user };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async becomePremium(
    id: string,
    userAuth: User,
    createSubscription: CreateSubscriptionDto,
  ) {
    const user = await this.findOne(id, userAuth);

    user.roles = [ValidRoles.USER_PREMIUM];
    user.revenue_id = createSubscription.revenue_id;

    await this.userRepository.save(user);

    return { user };
  }

  async removePremium(id: string, userAuth: User) {
    const user = await this.findOne(id, userAuth);

    user.roles = [ValidRoles.USER];
    user.revenue_id = null;

    await this.userRepository.save(user);

    return { user };
  }

  async passwordRecovery({ email }: PasswordRecoveryDto) {
    // Genera código de seguridad de 6 digitos
    const securityCode = String(Math.floor(Math.random() * 1000000)).padStart(
      6,
      '0',
    );

    try {
      const user = await this.findUserByEmail(email);

      if (!user)
        this.handleExceptions({
          status: 404,
          message: `No se pudo recuperar el usuario con el email "${email.toLowerCase()}".`,
        });

      if (user.google)
        this.handleExceptions({
          status: 403,
          message: `El usuario se encuentra registrado con google, no es posible recuperar la contraseña.`,
        });

      user.temporalSecurityCode = securityCode;

      await this.userRepository.save(user);

      await this.transporter.sendMail({
        from: `"PayBook" <${this.configService.get('EMAIL_APP')}>`,
        to: user.email,
        subject: 'Recupero de contraseña',
        html: `
            <p>Tu código para recuperar la contraseña es: </p>
            <b>${securityCode}<b/>
        `,
      });

      return {
        ok: true,
        message: 'Código de seguridad enviado por email',
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async validateSecurityCode({ code, email }: SecurityCodeDto) {
    const user = await this.userRepository.findOneBy({
      email: email.toLowerCase(),
      temporalSecurityCode: code,
    });

    if (!user)
      this.handleExceptions({
        status: 404,
        message: `Código de seguridad inválido`,
      });

    user.temporalSecurityCode = null;

    await this.userRepository.save(user);

    try {
      return {
        ok: true,
        message: 'Código correcto',
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async renewPassword({ email, password }: RenewPasswordDto) {
    const user = await this.findUserByEmail(email);

    if (!user)
      this.handleExceptions({
        status: 404,
        message: `No se pudo recuperar el usuario con el email "${email.toLowerCase()}".`,
      });

    // Validar contraseña nueva
    const isSameLastPass = bcrypt.compareSync(password, user.password);
    if (isSameLastPass) {
      this.handleExceptions({
        status: 403,
        message: 'La contraseña no puede ser igual a la anterior',
      });
    }

    user.password = bcrypt.hashSync(password, 10);

    await this.userRepository.save(user);

    try {
      return {
        ok: true,
        message: 'Contraseña actualizada correctamente',
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Valida que sea el mismo usuario que se quiere modificar o un admin
   * @param userAuth User que realiza la peticion
   * @param userModifiedId User a modificar
   */
  private isAuthUser(userAuth: User, userModifiedId: string) {
    if (
      (userAuth.id !== userModifiedId &&
        !userAuth.roles.includes(ValidRoles.ADMIN)) ||
      userAuth.google
    ) {
      this.handleExceptions({
        status: 403,
        message: `You don't have permission to perform this action`,
      });
    }
  }

  async createNewUser(body: CreateUserDto, { google }: { google: boolean }) {
    try {
      // Creo user
      const user = this.userRepository.create({
        ...body,
        password: bcrypt.hashSync(body.password, 10),
        email: body.email.toLocaleLowerCase(),
        google: google,
      });

      // Creo cuenta por defecto para el usuario creado
      const account = this.accountRepository.create({
        ...defaultAccount,
        access_key: generateAccountAccessKey(),
        // Creo categorias por defecto para la cuenta creada
        categories: this.categoryRepository.create(
          defaultCategories.map((cat) => ({
            name: cat.name,
            // Creo subcategorias por defecto para cada categoria creada
            subcategories: this.subcategoryRepository.create(
              cat.subcategories.map((subcat) => ({
                name: subcat,
              })),
            ),
          })),
        ),
      });

      user.accounts = [account];
      user.accounts_admin = [account];
      user.accounts_owner = [account];

      await this.userRepository.save(user);

      delete user.password;
      delete user.accounts;
      delete user.accounts_admin;
      delete user.accounts_owner;

      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findUserByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
        select: {
          email: true,
          password: true,
          id: true,
          isActive: true,
          fullName: true,
          roles: true,
          google: true,
          revenue_id: true,
          temporalSecurityCode: true,
        },
      });

      return user;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async googleVerify(token = '') {
    try {
      const userInfo = await this.axios.get(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const { name, email } = userInfo.data;

      return {
        name,
        email,
      };
    } catch (error) {
      throw new UnauthorizedException('Token google inválido');
    }
  }

  handleExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if (error.status === 400) {
      throw new BadRequestException(error.message);
    }

    if (error.status === 401) {
      throw new UnauthorizedException(error.message);
    }

    if (error.status === 403) {
      throw new ForbiddenException(error.message);
    }

    if (error.status === 404) {
      throw new NotFoundException(error.message);
    }

    if (error.status === 401) {
      throw new UnauthorizedException(error.message);
    }

    this.logger.error(error);
    console.log(error);

    throw new InternalServerErrorException(error);
  }
}
