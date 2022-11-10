import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as validateUUID } from 'uuid';

import { Account } from '../accounts/entities/account.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger();

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, idAccount: string) {
    // Capitalizar nombres para guardar
    const nameCategory = createCategoryDto.name.trim().toLowerCase();
    const capitalizeName = nameCategory.replace(
      nameCategory[0],
      nameCategory[0].toUpperCase(),
    );

    // Busca cuenta actual
    const account = await this.findActualAccount(idAccount);

    // Valida que no exista una categoria activa llamada igual en la misma cuenta
    const existNameCategory = account.categories.find(
      (cat) => cat.name === capitalizeName,
    );
    if (existNameCategory && existNameCategory.isActive)
      throw new BadRequestException(
        `Already exist category named ${capitalizeName} on this account`,
      );

    try {
      let category: Category;

      // Si existe categoria eliminada con ese nombre la reactivo
      if (existNameCategory && !existNameCategory.isActive) {
        category = {
          ...existNameCategory,
          isActive: true,
          account,
        };
      }

      // Si no existia categoria con ese nombre creo una nueva
      if (!existNameCategory) {
        category = this.categoryRepository.create({
          name: capitalizeName,
          account,
        });
      }

      await this.categoryRepository.save(category);
      delete category.account?.categories;
      return { category };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(idAccount: string) {
    // Busca cuenta actual
    const account = await this.findActualAccount(idAccount);

    const categories = account.categories
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((cat) => ({
        ...cat,
        subcategories: cat.subcategories.filter((subcat) => subcat.isActive),
      }));

    return { categories };
  }

  async findOne(id: string) {
    try {
      const category = await this.categoryRepository.findOne({
        where: { id },
        relations: { account: true },
      });

      if (!category)
        this.handleExceptions({
          status: 404,
          message: `Doesnt exist category with id ${id}`,
        });

      if (!category.isActive)
        this.handleExceptions({
          status: 404,
          message: `The category was deleted`,
        });

      return category;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    const categoryUpdated = {
      ...category,
      ...updateCategoryDto,
    };

    try {
      await this.categoryRepository.save(categoryUpdated);

      return {
        category: categoryUpdated,
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    category.isActive = false;

    try {
      await this.categoryRepository.save(category);
      return { category };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  /**
   * Busca y retorna cuenta completa basada en id
   * @param idAccount id de cuenta actual
   * @returns complete exists account
   */
  private async findActualAccount(idAccount: string) {
    if (!validateUUID(idAccount))
      throw new BadRequestException(`"idAccount" is not a valid uuid`);

    try {
      return await this.accountRepository.findOne({
        where: { id: idAccount },
        relations: { categories: true },
      });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: any) {
    if (error.status === 404) {
      throw new NotFoundException(error.message);
    }

    if (error.status === 403) {
      throw new ForbiddenException(error.message);
    }

    this.logger.error(error);
    throw new InternalServerErrorException(error);
  }
}
