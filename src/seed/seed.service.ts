import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {Account} from '../accounts/entities/account.entity';
import {User} from '../users/entities/user.entity';
import {adminTest,user1,user2,user3,account1,account2,account3, category1, category2, category3, subcategory1, subcategory2, subcategory3} from './mocks/seedMock';
import {generateAccountAccessKey} from '../common/helpers/generateAccountAccessKey';
import {ValidRoles} from '../auth/interfaces';
import {JwtService} from '@nestjs/jwt';
import {Category} from '../categories/entities/category.entity';
import {Subcategory} from '../subcategories/entities/subcategory.entity';

@Injectable()
export class SeedService {

  private readonly logger = new Logger('SeedService')

  constructor(
    @InjectRepository(User)
    private readonly userRepository:Repository<User>,
    @InjectRepository(Account)
    private readonly accountRepository:Repository<Account>,
    @InjectRepository(Category)
    private readonly categoryRepository:Repository<Category>,
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository:Repository<Subcategory>,
    private readonly jwtService:JwtService
  ){}

  async executeSeed(){
      try {
        await this.cleanDB()

        // Crear admin
        const admin = this.createAdmin()
        
        // Crear usuarios
        let users = this.createUsers()

        // Crear cuentas para cada usuario
        const usersWithAccounts = this.createAccountsForEachUser(users)

        // Save all users and admins with their accounts
        await this.userRepository.save([...usersWithAccounts, admin])

        delete admin.password

        return {
          message:'Seed executed',
          users: usersWithAccounts.map( user => {
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
      await this.subcategoryRepository.delete({})
      await this.categoryRepository.delete({})
      await this.accountRepository.delete({})
      await this.userRepository.delete({})

      return {
        message: 'DB cleaned'
      }

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private createAdmin(){
    return this.userRepository.create({
        ...adminTest,
        roles: [ValidRoles.ADMIN]
      }
    )
  }

  private createUsers(){
    return this.userRepository.create([
      user1,
      user2,
      user3
    ])
  }

  private createAccountsForEachUser(users:User[]):User[]{
    return users.map((user,idx) =>{
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
      
      const accountsWithCategories = this.createCategoriesForEachAccount(accounts)

      user.accounts = accountsWithCategories
      user.accounts_admin = accountsWithCategories
      user.accounts_owner = accountsWithCategories

      return user
    })
  }

  private createCategoriesForEachAccount(accounts:Account[]):Account[]{

    return accounts.map( account => {
      const categories = this.categoryRepository.create([
          {...category1},
          {...category2},
          {...category3},
        ])

        const categoriesWithSubcategories = this.createSubategoriesForEachCategory(categories)
        
        account.categories = categoriesWithSubcategories;

        return account
    })

  }

  private createSubategoriesForEachCategory(categories:Category[]):Category[]{

    return categories.map( cat => {
      const subcategories = this.subcategoryRepository.create([
          {...subcategory1},
          {...subcategory2},
          {...subcategory3},
        ])

        cat.subcategories = subcategories;

        return cat
    })

  }

  private handleExceptions(error:any){
    this.logger.error(error)
    throw new InternalServerErrorException(error)
  }

}
