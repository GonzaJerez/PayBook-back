import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { User } from '../users/entities/user.entity';
import { ValidRoles } from '../auth/interfaces';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AdminService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async createAdmin(createAuthDto: CreateUserDto) {
    const { password, ...rest } = createAuthDto;

    try {
      await this.existAdmin();

      const user = this.userRepository.create({
        password: bcrypt.hashSync(password, 10),
        roles: [ValidRoles.ADMIN],
        ...rest,
      });
      await this.userRepository.save(user);

      delete user.password;

      return {
        ...user,
        accounts: [],
        token: this.authService.generateToken({ id: user.id }),
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private async existAdmin() {
    try {
      const queryBuilder = this.userRepository.createQueryBuilder();
      const existAdmin = await queryBuilder
        .where('roles && :roles', { roles: [ValidRoles.ADMIN] })
        .getOne();

      if (existAdmin)
        return this.handleExceptions({
          status: 403,
          message: 'Already exist an Admin',
        });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  handleExceptions(error: any) {
    if (error.status === 403) {
      throw new ForbiddenException(error.message);
    }

    this.logger.error(error);

    throw new InternalServerErrorException('Mensaje de error');
  }
}
