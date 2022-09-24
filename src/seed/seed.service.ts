import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Account} from '../accounts/entities/account.entity';
import {User} from '../users/entities/user.entity';
import {adminTest,user1,user2,user3,account1,account2,account3} from './mocks/seedMock';
import {generateAccountAccessKey} from '../common/helpers/generateAccountAccessKey';
import {ValidRoles} from '../auth/interfaces';
import {JwtService} from '@nestjs/jwt';

@Injectable()
export class SeedService {

  private readonly logger = new Logger('SeedService')

  constructor(
    @InjectRepository(User)
    private readonly userRepository:Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository:Repository<Account>,
    private readonly jwtService:JwtService
  ){}

  async executeSeed(){
      try {
        await this.cleanDB()

        // Crear admins
        const admin = this.userRepository.create({
            ...adminTest,
            roles: [ValidRoles.ADMIN]
          }
        )

        // Crear users with 3 accounts each
        const users = this.userRepository.create([
          user1,
          user2,
          user3
        ])

        users.forEach((user,idx) =>{
          let accounts:Account[]

          if(idx === 0){
            accounts = this.accountRepository.create([
              {
                ...account1, 
                access_key: generateAccountAccessKey(),
              },
              {
                ...account2, 
                access_key: generateAccountAccessKey(),
              },
              {
                ...account3, 
                access_key: generateAccountAccessKey(),
              },
            ]);

          } else {
            accounts = this.accountRepository.create([
              {
                ...account1, 
                access_key: generateAccountAccessKey(),
              },
              {
                ...account2, 
                access_key: generateAccountAccessKey(),
              },
            ]);

          }
          user.accounts = accounts
          user.accounts_admin = accounts
          user.accounts_owner = accounts      
        })

        // Save all users and admins with their accounts
        await this.userRepository.save([...users, admin])

        delete admin.password

        return {
          message:'Seed executed',
          users: users.map( user => {
            const token = this.jwtService.sign({id:user.id})
            delete user.password;
            return {...user, token}
          }),
          admin: {
            ...admin,
            token: this.jwtService.sign({id:admin.id})
          }
        }

      } catch (error) {
        this.handleExceptions(error)
      }
  }

  async cleanDB(){
    try {
      // Limpiar DB
      await this.accountRepository.delete({})
      await this.userRepository.delete({})

      return {
        message: 'DB cleaned'
      }

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  handleExceptions(error:any){
    this.logger.error(error)
    throw new InternalServerErrorException(error)
  }

}
