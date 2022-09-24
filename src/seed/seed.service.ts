import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Account} from '../accounts/entities/account.entity';
import {User} from '../users/entities/user.entity';
import {mockAdminUser, mockAdminUser2, mockCreateUser, mockCreateUser2, mockCreateUser3} from '../users/mocks/userMocks';
import {generateAccountAccessKey} from '../common/helpers/generateAccountAccessKey';
import {mockToCreateAccount, mockToCreateSecondAccount, mockToCreateThirdAccount} from '../accounts/mocks/accountMocks';
import {ValidRoles} from '../auth/interfaces';

@Injectable()
export class SeedService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository:Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository:Repository<Account>,
  ){}

  async executeSeed(){
      try {
        // Limpiar DB
        await this.accountRepository.delete({})
        await this.userRepository.delete({})

        // Crear admins
        const admins = this.userRepository.create([
          {
            ...mockAdminUser,
            roles: [ValidRoles.ADMIN]
          },
          {
            ...mockAdminUser2,
            roles: [ValidRoles.ADMIN]
          },
        ])

        // Crear users with 3 accounts each
        const users = this.userRepository.create([
          mockCreateUser,
          mockCreateUser2,
          mockCreateUser3
        ])

        users.forEach(user =>{
          const accounts = this.accountRepository.create([
            {
              ...mockToCreateAccount, 
              access_key: generateAccountAccessKey(),
            },
            {
              ...mockToCreateSecondAccount, 
              access_key: generateAccountAccessKey(),
            },
            {
              ...mockToCreateThirdAccount, 
              access_key: generateAccountAccessKey(),
            },
          ]);

          user.accounts = accounts
          user.accounts_admin = accounts
          user.accounts_owner = accounts
        })

        // Save all users and admins with their accounts
        await this.userRepository.save([...users,...admins])

        return {message:'Seed executed'}

      } catch (error) {
        console.log(error);
        
      }
  }

}
