import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ValidRoles } from './interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  
  private readonly logger = new Logger('AuthService')

  constructor(
    @InjectRepository(User)
    public userRepository:Repository<User>,
    public jwtService:JwtService,
    public configService:ConfigService
  ){}

  async create(createAuthDto: CreateUserDto) {

    const {password, ...rest} = createAuthDto;

    try {
      const user = this.userRepository.create({
        password: bcrypt.hashSync(password, 10),
        ...rest
      });
      await this.userRepository.save(user)

      delete user.password;
      
      return {
        ...user,
        accounts:[],
        token: this.generateToken({id:user.id})
      };
      
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(queryParameters:PaginationDto) {
    const {limit = 10, offset=0} = queryParameters;
    try {
      const [users, totalUsers] = await this.userRepository.findAndCount({
        take: limit,
        skip: offset,
      });
      
      return {
        totalUsers,
        limit,
        skip: offset,
        users,
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOneBy({id})
      if(!user) this.handleExceptions({
        ok:false,
        message: `User with id ${id} not found`
      });

      return user
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, user:User) {

    this.isAuthUser(user, id);
    
    try {
      const userUpdated = await this.userRepository.preload({
        id,
        ...updateUserDto,
      })

      if(!userUpdated) this.handleExceptions({
        ok:false,
        message: `User with id ${id} not found`
      });
      
      await this.userRepository.save(userUpdated)
  
      return {
        ...userUpdated,
        accounts: user.accounts
      }
      
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string, userAuth:User) {

    this.isAuthUser(userAuth, id)

    try {
      const user = await this.findOne(id);
  
      user.isActive = false;
  
      await this.userRepository.save(user);
  
      return user;
      
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async login(loginUserDto:LoginUserDto){
    const {email,password} = loginUserDto;

    try {
      // Para poder recuperar la password que por defecto no viene en la entity
      const user = await this.userRepository.findOne({
        where: {email},
        select: {email:true, password:true, id:true}
      })
      
  
      if (!user || !bcrypt.compareSync(password, user.password))
        this.handleExceptions({
          ok:false,
          message: `Credentials are not valid`
        })
  
      delete user.password;
      delete user.accounts;
  
      return {
        ...user,
        token: this.generateToken({id: user.id})
      }
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async activate(id:string){
    try {
      const user = await this.findOne(id);

      user.isActive = true;
  
      await this.userRepository.save(user);
  
      return user;
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**
   * Elimina todos los usuarios (solo desarrollo)
   */
  async cleanUsers(){
    if (this.configService.get('STAGE') !== 'dev')
      throw new ForbiddenException(`Option only can be used in dev`)

    try {
      await this.userRepository.delete({})
      return {message:'Users table clean'}
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**
   * Valida que sea el mismo usuario que se quiere modificar o un admin
   * @param userAuth User que realiza la peticion
   * @param userModifiedId User a modificar
   */
  private isAuthUser(userAuth:User, userModifiedId:string){
    if (userAuth.id !== userModifiedId && !userAuth.roles.includes(ValidRoles.ADMIN)) {
      throw new ForbiddenException(`You don't have permission to perform this action`)
    }
  }

  generateToken(payload:JwtPayload){
    return this.jwtService.sign(payload)
  }

  handleExceptions(error:any){
    
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }

    if(error.message === 'Already exist an Admin'){
      throw new ForbiddenException(error.message)
    }

    if(error.message.startsWith('User with id ')){
      throw new NotFoundException(error.message)
    }

    if(error.message === 'Credentials are not valid'){
      throw new UnauthorizedException(error.message)
    }

    this.logger.error(error);
    
    throw new InternalServerErrorException('Mensaje de error')
  }
}
