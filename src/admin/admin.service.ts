import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'

import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService extends AuthService {

    constructor(
        userRepository: Repository<User>,
        jwtService: JwtService,
    ) {
        super(userRepository, jwtService)
    }

    async createAdmin(createAuthDto: CreateUserDto) {

        const { password, ...rest } = createAuthDto;

        try {
            await this.existAdmin()

            const user = this.userRepository.create({
                password: bcrypt.hashSync(password, 10),
                roles: [ValidRoles.ADMIN],
                ...rest
            });
            await this.userRepository.save(user)

            delete user.password;

            return {
                ...user,
                accounts: [],
                token: this.generateToken({ id: user.id })
            };

        } catch (error) {
            this.handleExceptions(error);
        }
    }

    private async existAdmin() {
        try {
            const queryBuilder = this.userRepository.createQueryBuilder()
            const existAdmin = await queryBuilder
                .where('roles && :roles', { roles: [ValidRoles.ADMIN] })
                .getOne()

            if (existAdmin) return this.handleExceptions({
                ok: false,
                message: "Already exist an Admin"
            });
        } catch (error) {
            this.handleExceptions(error)
        }
    }

    private handleExceptions(error:any){
    
        if (error.code === '23505') {
          throw new BadRequestException(error.detail);
        }
    
        if(error.message === 'Already exist an Admin'){
          throw new ForbiddenException(error.message)
        }
    
        this.logger.error(error);
        
        throw new InternalServerErrorException('Mensaje de error')
    }
}
