import {BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
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

  async create(createSubcategoryDto: CreateSubcategoryDto, idCategory: string) {
    const nameSubcategory = createSubcategoryDto.name.trim()

    const category = await this.findActualCategory(idCategory)

    // Valida que no exista una subcategoria activa llamada igual en la misma categoria
    const existNameSubcategory = category.subcategories.find(cat => cat.name === nameSubcategory)
    if (existNameSubcategory && existNameSubcategory.isActive)
      throw new BadRequestException(`Already exist subcategory named ${nameSubcategory} on this category`)

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
            name: nameSubcategory,
            category
          })
        }
        
        await this.subcategoryRepository.save(subcategory)
        delete subcategory.category?.subcategories
        return subcategory;
  
      } catch (error) {
        this.handleExceptions(error)
      }
  }

  async findAll(idCategory:string) {

     // Busca categoria actual
     const category = await this.findActualCategory(idCategory)
    
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

        return subcategory;
    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto) {
    
    const subcategory = await this.findOne(id)

    const subcategoryUpdated = {
      ...subcategory,
      ...updateSubcategoryDto
    }

    try {
      await this.subcategoryRepository.save(subcategoryUpdated)

      return subcategoryUpdated;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  async remove(id: string) {
    const subcategory = await this.findOne(id)

    subcategory.isActive = false;

    try {
      await this.subcategoryRepository.save(subcategory);
      return subcategory;

    } catch (error) {
      this.handleExceptions(error)
    }
  }

  /**
  * Busca y retorna categoria completa basada en id
  * @param idCategory id de categoria actual
  * @returns complete exists category
  */
  private async findActualCategory(idCategory: string) {

    if (!validateUUID(idCategory))
      throw new BadRequestException(`"idCategory" is not a valid uuid`)

    try {
      return await this.categoryRepository.findOne({
        where: {id: idCategory},
      })

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
