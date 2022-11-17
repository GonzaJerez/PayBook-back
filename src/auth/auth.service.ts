import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import axios, { Axios } from 'axios';

import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ValidRoles } from './interfaces';
import { ConfigService } from '@nestjs/config';
import { PasswordRecoveryDto } from './dto/password-recovery.dto';
import { transporter } from '../common/helpers/nodemailer.config';
import { SecurityCodeDto } from './dto/security-code.dto';
import { RenewPasswordDto } from './dto/renew-password.dto';

@Injectable()
export class AuthService {
  logger = new Logger('AuthService');
  private readonly axios: Axios = axios;
  private readonly transporter = transporter;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      // Para poder recuperar la password que por defecto no viene en la entity
      const user = await this.userRepository.findOne({
        where: { email: email.toLocaleLowerCase() },
        select: {
          email: true,
          password: true,
          id: true,
          isActive: true,
          fullName: true,
          roles: true,
          google: true,
        },
        relations: { accounts: true },
      });

      if (!user)
        this.handleExceptions({
          status: 401,
          message: `No existe usuario registrado con el email ${email}`,
        });

      if (!user?.isActive)
        this.handleExceptions({
          status: 403,
          message: 'Usuario eliminado. Contactese con soporte',
        });

      if (user?.google)
        this.handleExceptions({
          status: 401,
          message: 'Usuario registrado con google',
        });

      if (!bcrypt.compareSync(password, user.password))
        this.handleExceptions({
          status: 401,
          message: 'Credenciales no válidas',
        });

      delete user.password;
      delete user.accounts;

      // const { user: checkedUser } = await this.checkIsPremium(user);

      return {
        user,
        token: this.generateToken({ id: user.id }),
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async checkToken(user: User) {
    // const { user: checkedUser } = await this.checkIsPremium(user);
    return {
      user,
      token: this.generateToken({ id: user.id }),
    };
  }

  generateToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  /**
   * Valida si el usuario logueado es premium o no
   * @param user actualUser
   * @returns user updated after checking if still be premium or not
   */
  async checkIsPremium(user: User) {
    let checkedUser = user;

    try {
      const { data } = await this.axios.get(
        `https://api.revenuecat.com/v1/subscribers/${user.revenue_id || ''}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configService.get(
              'REVENUE_API_KEY',
            )}`,
          },
        },
      );

      if (
        !data?.subscriber?.subscriptions.paybook_pro ||
        data?.subscriber?.subscriptions?.paybook_pro?.unsubscribe_detected_at
      ) {
        checkedUser = {
          ...user,
          roles: [ValidRoles.USER],
          revenue_id: null,
        };

        await this.userRepository.save(checkedUser);
      }

      return {
        user: checkedUser,
      };
    } catch (e) {
      return { user };
    }
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

  handleExceptions(error: any) {
    if (error.status === 401) {
      throw new UnauthorizedException(error.message);
    }

    if (error.status === 403) {
      throw new ForbiddenException(error.message);
    }

    if (error.status === 404) {
      throw new NotFoundException(error.message);
    }

    this.logger.error(error);

    throw new InternalServerErrorException('Mensaje de error');
  }
}
