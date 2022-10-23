import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ValidRoles} from '../auth/interfaces';
import {User} from '../users/entities/user.entity';
import {Repository} from 'typeorm';
import {validate as validateUUID} from 'uuid'

import {Category} from '../categories/entities/category.entity';
import {CreateSubcategoryDto} from './dto/create-subcategory.dto';
import {UpdateSubcategoryDto} from './dto/update-subcategory.dto';
import {Subcategory} from './entities/subcategory.entity';

@Injectable()
export class SubcategoriesService {

  private readonly logger = new Logger()

  constructor(
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createSubcategoryDto: CreateSubcategoryDto, idCategory: string, user:User) {

    // Capitalizar nombres para guardar
    const nameSubcategory = createSubcategoryDto.name.trim().toLowerCase()
    const capitalizeName = nameSubcategory.replace(nameSubcategory[0], nameSubcategory[0].toUpperCase())

    const category = await this.findActualCategory(idCategory, user)

    // Valida que no exista una subcategoria activa llamada igual en la misma categoria
    const existNameSubcategory = category.subcategories.find(cat => cat.name === capitalizeName)
    if (existNameSubcategory && existNameSubcategory.isActive)
      throw new BadRequestException(`Already exist subcategory named ${capitalizeName} on this category`)

      try {
        let subcategory:Subcategory
  
        // Si existe subcategoria eliminada con ese nombre la reactivo
        if(existNameSubcategory && !existNameSubcategory.isActive){
          subcategory = {
            ...existNameSubcategory,
            isActive: true,
            category
          }
        }
  
        // Si no existia subcategoria con ese nombre creo una nueva
        if (!existNameSubcategory) {
          subcategory = this.subcategoryRepository.create({
            name: capitalizeName,
            category
          })
        }
        
        await this.subcategoryRepository.save(subcategory)
        delete subcategory.category?.subcategories
        return {subcategory};
  
      } catch (error) {
        this.handleExceptions(error)
      }
  }

  async findAll(idCategory:string, user:User) {

     // Busca categoria actual
     const category = await this.findActualCategory(idCategory, user)
    
     const subcategories = category.subcategories.filter(cat => cat.isActive)
 
     return subcategories
  }

  async findOne(id: string) {
    try {
      const subcategory = await this.subcategoryRepository.findOne({
        where:{id},
        relations: {category:true}
      })

      if(!subcategory)
        this.handleExceptions({
          status: 404,
          message: `Doesnt exist subcategory with id ${id}`
        })

        if(!subcategory.isActive)
        this.handleExceptions({
          status: 404,
          message: `The subcategory was deleted`
        })

        return {subcategory};
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto) {
    
    const {subcategory} = await this.findOne(id)

    const subcategoryUpdated = {
      ...subcategory,
      ...updateSubcategoryDto
    }

    try {
      await this.subcategoryRepository.save(subcategoryUpdated)

      return {
        subcategory: subcategoryUpdated
      };

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async remove(id: string) {
    const {subcategory} = await this.findOne(id)

    subcategory.isActive = false;

    try {
      await this.subcategoryRepository.save(subcategory);
      return {subcategory};

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**
  * Busca y retorna categoria completa basada en id
  * @param idCategory id de categoria actual
  * @returns complete exists category
  */
  private async findActualCategory(idCategory: string, user:User) {

    if (!validateUUID(idCategory))
      throw new BadRequestException(`"idCategory" is not a valid uuid`)

    try {
      const actualCategory = await this.categoryRepository.findOne({
        where: {id: idCategory},
      })

      if(!actualCategory.isActive && !user.roles.includes(ValidRoles.ADMIN))
        this.handleExceptions({
          status: 404,
          message: 'Doesnt exist category'
        })

      return actualCategory
      

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  private handleExceptions(error: any) {

    if (error.status === 404) {
      throw new NotFoundException(error.message)
    }

    if (error.status === 403) {
      throw new ForbiddenException(error.message)
    }

    this.logger.error(error)
    throw new InternalServerErrorException(error)
  }
}
