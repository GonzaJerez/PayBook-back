import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { User } from 'src/auth/entities/user.entity';
import { ValidRoles } from 'src/auth/interfaces';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'

@Injectable()
export class AdminService extends AuthService{

    constructor(
        userRepository:Repository<User>,
        jwtService:JwtService,
        configService:ConfigService
    ){
        super(userRepository,jwtService,configService)
    }

    async createAdmin(createAuthDto: CreateUserDto) {

        const {password, ...rest} = createAuthDto;
    
        try {
          await this.existAdmin()
    
          const user = this.userRepository.create({
            password: bcrypt.hashSync(password, 10),
            roles:[ ValidRoles.ADMIN ],
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

    private async existAdmin(){
        try {
          const queryBuilder = this.userRepository.createQueryBuilder()
          const existAdmin = await queryBuilder
            .where('roles && :roles',{ roles: [ValidRoles.ADMIN]})
            .getOne()
    
          if(existAdmin) return this.handleExceptions({
            ok:false,
            message: "Already exist an Admin"
          });
        } catch (error) {
          this.handleExceptions(error)
        }
      }
}
