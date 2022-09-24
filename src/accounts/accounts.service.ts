import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {validate as uuidValidate} from 'uuid'

import {generateAccountAccessKey} from '../common/helpers/generateAccountAccessKey';
import {User} from '../users/entities/user.entity';
import {Repository, SelectQueryBuilder} from 'typeorm';
import {CreateAccountDto} from './dto/create-account.dto';
import {UpdateAccountDto} from './dto/update-account.dto';
import {Account} from './entities/account.entity';
import {ValidRoles} from '../auth/interfaces';
import {PaginationDto} from '../common/dtos/pagination.dto';
import {JoinAccountDto} from './dto/join-account.dto';
import {PushOutAccountDto} from './dto/push-out-account.dto';

@Injectable()
export class AccountsService {

    private readonly LIMIT_FREE_ACCOUNT = 2
    private readonly logger = new Logger()

    constructor(
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>
    ) {}


    async create(createAccountDto: CreateAccountDto, user: User) {

        this.validateLimitAccounts(user)

        try {
            const account = this.accountRepository.create({
                ...createAccountDto,
                access_key: generateAccountAccessKey(),
                admin_user: user,
                creator_user: user,
                users: [user]
            })

            await this.accountRepository.save(account)
            return account

        } catch (error) {
            this.handleExceptions(error);
        }
    }


    async findAll(queryParameters: PaginationDto) {

        const {limit = 10, offset = 0} = queryParameters;

        try {
            const [accounts, totalAccounts] = await this.accountRepository.findAndCount({
                take: limit,
                skip: offset,
                relations: {creator_user: true, admin_user: true, users: true}
            })

            return {
                totalAccounts,
                limit,
                offset,
                accounts
            };
        } catch (error) {
            this.handleExceptions(error)
        }
    }


    async findOne(id: string, user: User) {

        this.isAuthUser(user, id)

        try {
            const account = await this.accountRepository.findOne({
                where: {id},
                relations: {admin_user: true, creator_user: true, users: true}
            })

            this.isValidAccount(account, user)
            return account

        } catch (error) {
            this.handleExceptions(error)
        }
    }

    async update(id: string, updateAccountDto: UpdateAccountDto, user: User) {

        const accountToUpdate = await this.findOne(id, user)

        this.isAdminAccount(accountToUpdate, user)

        try {
            const updatedAccount = {
                ...accountToUpdate,
                ...updateAccountDto
            }

            await this.accountRepository.save(updatedAccount)
            return updatedAccount

        } catch (error) {
            this.handleExceptions(error)
        }
    }


    async join(joinAccountDto: JoinAccountDto, user: User) {

        // Recupera la cuenta completa con todas sus relaciones
        const account = await this.findAccountWithRelations({...joinAccountDto}, user)

        if (this.idsUsersInAccount(account.users).includes(user.id))
            throw new BadRequestException(`User already exist in this account`)

        // Valida que la cuenta no haya llegado al limite de usuarios
        if (account.users.length === account.max_num_users)
            throw new ForbiddenException(`The account already has the maximum number of users`)

        account.users = [...account.users, user]

        try {
            await this.accountRepository.save(account)
            return account

        } catch (error) {
            this.handleExceptions(error)
        }
    }


    async leave(id: string, user: User) {
        try {
            // Recupera la cuenta completa con sus relaciones
            const account = await this.findAccountWithRelations({id}, user)

            // Si el usuario existe en esta cuenta lo elimino
            if (this.idsUsersInAccount(account.users).includes(user.id)) {
                account.users = account.users.filter(us => us.id !== user.id)

                // Si todavia quedan mas usuarios hago el cambio de administrador
                // sino desactivo la cuenta
                if (account.users.length > 0) {
                    account.admin_user = account.users[0]
                } else {
                    account.isActive = false
                }
            }

            // Actualizo la cuenta y la retorno
            await this.accountRepository.save(account)
            return account

        } catch (error) {
            this.handleExceptions(error)
        }
    }


    async pushout(id: string, pushOutAccountDto: PushOutAccountDto, user: User) {
        // Recupera la cuenta completa con sus relaciones
        const account = await this.findAccountWithRelations({id}, user)

        this.isAdminAccount(account, user)

        // Elimina de "account.users" todos los usuarios que envia el cliente
        account.users = account.users.filter(us => {
            for (const userId of pushOutAccountDto.idUsers) {
                if (!uuidValidate(userId)) {
                    throw new BadRequestException(`The userIds are not uuid's invalid`)
                }
                return us.id !== userId
            }
        })

        try {
            await this.accountRepository.save(account)
            return account
        }
        catch (error) {
            this.handleExceptions(error)
        }
    }


    async remove(id: string, user: User) {

        // Recupera la cuenta completa con sus relaciones
        const account = await this.findAccountWithRelations({id}, user)

        this.isAdminAccount(account, user)

        account.isActive = false;

        try {
            await this.accountRepository.save(account)
            return account;

        } catch (error) {
            this.handleExceptions(error)
        }
    }

    /**
     * Valida si usuario es un admin
     * @param user User
     * @returns boolean
     */
    private isAdmin(user: User): boolean {
        return user.roles.includes(ValidRoles.ADMIN)
    }

    /**
     * Valida que un usuario no premium no exceda la cantidad de cuentas FREE
     * @param user usuario que hace peticion
     */
    private validateLimitAccounts(user: User) {
        if (user.accounts.length === this.LIMIT_FREE_ACCOUNT && user.roles.includes(ValidRoles.USER))
            throw new ForbiddenException('To create a more accounts user needs to be premium')
    }

    /**
       * Valida que sea un usuario de la cuenta actual o un admin
       * @param userAuth User que realiza la peticion
       * @param accountModifiedId User a modificar
       */
    private isAuthUser(userAuth: User, accountModifiedId: string) {
        const accountsIds = userAuth.accounts.map(account => account.id)
        if (!accountsIds.includes(accountModifiedId) && !this.isAdmin(userAuth)) {
            throw new ForbiddenException(`You don't have permission to perform this action`)
        }
    }

    /**
     * Valida que usuario sea administrador de cuenta o un admin
     * @param account cuenta actual
     * @param user usuario que hace la peticion
     */
    private isAdminAccount(account: Account, user: User) {
        if (account.admin_user.id !== user.id && !this.isAdmin(user))
            this.handleExceptions({
                status: 403,
                message: `Don't have admin permissions`
            })
    }

    /**
     * Busca cuenta en DB y la retorna con todas sus relaciones
     * @param term termino por el que se va a buscar
     * @returns cuenta con todas sus relaciones
     */
    private async findAccountWithRelations(term: {[term: string]: string}, user: User) {
        try {
            // Busco cuenta por "id" o "access_key"
            const account = await this.accountRepository.findOne({
                where: term,
                relations: {admin_user: true, creator_user: true, users: true}
            })

            this.isValidAccount(account, user)

            return account;

        } catch (error) {
            this.handleExceptions(error)
        }
    }

    /**
     * Valida que la cuenta exista y este activa
     * @param account cuenta actual
     * @param user Usuario que hace peticion, si es admin va a poder ver las cuentas desactivadas
     */
    private isValidAccount(account: Account, user: User) {
        if (!account) this.handleExceptions({
            status: 404,
            message: `Account not found`
        })

        if (!account.isActive && !this.isAdmin(user))
            this.handleExceptions({
                status: 404,
                message: `The account no longer exists, it was deleted`
            })
    }

    /**
     * Retorna array con los ids de cada usuario en cuenta
     * @param usersInAccount Array de usuarios en cuenta
     * @returns Array de ids de cada usuario
     */
    private idsUsersInAccount(usersInAccount: User[]): string[] {
        return usersInAccount.map(us => us.id);
    }

    /**
     * Manejo de errores en ejecucion
     * @param error {status:n, message:string}
     */
    private handleExceptions(error: any) {

        if (error.status === 403) {
            throw new ForbiddenException(error.message)
        }

        if (error.status === 404) {
            throw new NotFoundException(error.message)
        }

        this.logger.error(error);

        throw new InternalServerErrorException('Mensaje de error')
    }
}
