import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  
  logger = new Logger('AuthService')

  constructor(
    @InjectRepository(User)
    public userRepository:Repository<User>,
    public jwtService:JwtService,
  ){}

  async login(loginUserDto:LoginUserDto){
    const {email,password} = loginUserDto;

    try {
      // Para poder recuperar la password que por defecto no viene en la entity
      const user = await this.userRepository.findOne({
        where: {email},
        select: {email:true, password:true, id:true}
      })
      
      if (!user || !bcrypt.compareSync(password, user.password))
        throw new UnauthorizedException('Credentials are not valid')
  
      delete user.password;
      delete user.accounts;
  
      return {
        ...user,
        token: this.generateToken({id: user.id})
      }
    } catch (error) {
      if(error.status === 401) throw new UnauthorizedException(error.message)
      
      this.logger.error(error);
      throw new InternalServerErrorException('Contact to admin')
    }
  }

  generateToken(payload:JwtPayload){
    return this.jwtService.sign(payload)
  }

}
