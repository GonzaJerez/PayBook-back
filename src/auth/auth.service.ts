import {ForbiddenException, Injectable, InternalServerErrorException, Logger, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {JwtService} from '@nestjs/jwt';
import {Repository} from 'typeorm';
import * as bcrypt from 'bcrypt'

import {LoginUserDto} from './dto/login-user.dto';
import {User} from '../users/entities/user.entity';
import {JwtPayload} from './interfaces/jwt-payload.interface';
import axios, {Axios} from 'axios';
import {ValidRoles} from './interfaces';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class AuthService {

  logger = new Logger('AuthService')
  private readonly axios: Axios = axios

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const {email, password} = loginUserDto;

    try {
      // Para poder recuperar la password que por defecto no viene en la entity
      const user = await this.userRepository.findOne({
        where: {email: email.toLocaleLowerCase()},
        select: {email: true, password: true, id: true, isActive: true, fullName: true, roles: true, google: true},
        relations: {accounts: true}
      })

      if (!user)
        this.handleExceptions({
          status: 401,
          message: `No existe usuario registrado con el email ${email}`
        })

      if (!user?.isActive)
        this.handleExceptions({
          status: 403,
          message: 'Usuario eliminado. Contactese con soporte'
        })

      if (user?.google)
        this.handleExceptions({
          status: 401,
          message: 'Usuario registrado con google'
        })

      if (!bcrypt.compareSync(password, user.password))
        this.handleExceptions({
          status: 401,
          message: 'Credenciales no válidas'
        })


      delete user.password;
      delete user.accounts;

      const {user:checkedUser} = await this.checkIsPremium(user)

      return {
        user: checkedUser,
        token: this.generateToken({id: user.id})
      }
    } catch (error) {
      this.handleExceptions(error)
    }
  }



  async checkToken(user: User) {
    const {user:checkedUser} = await this.checkIsPremium(user)
    return {
      user: checkedUser,
      token: this.generateToken({id: user.id})
    }
  }

  generateToken(payload: JwtPayload) {
    return this.jwtService.sign(payload)
  }


  async checkIsPremium(user:User) {
    let checkedUser = user;
    const {data} = await this.axios.get(`https://api.revenuecat.com/v1/subscribers/${user.id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.configService.get('REVENUE_API_KEY')}`
      }
    })

    if(!data?.subscriber?.subscriptions.paybook_pro || data?.subscriber?.subscriptions?.paybook_pro?.unsubscribe_detected_at){
      checkedUser= {
        ...user,
        roles: [ValidRoles.USER]
      }
      await this.userRepository.save(checkedUser)
    }
    
    return {
      user: checkedUser
    }
  }


  handleExceptions(error: any) {

    if (error.status === 401) {
      throw new UnauthorizedException(error.message)
    }

    if (error.status === 403) {
      throw new ForbiddenException(error.message)
    }

    this.logger.error(error);

    throw new InternalServerErrorException('Mensaje de error')
  }

}
