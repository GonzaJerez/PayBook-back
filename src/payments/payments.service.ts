import { Injectable } from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {ValidRoles} from '../auth/interfaces';
import {User} from '../users/entities/user.entity';
import {AxiosAdapter} from './adapters/axios.adapter';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {SearchSuscriptionPlansResponse, SuscriptionPayResponse} from './interfaces/mp-responses.interface';

@Injectable()
export class PaymentsService {

  private readonly baseUrlMP = 'https://api.mercadopago.com'

  constructor(
    private readonly configService:ConfigService,
    private readonly http:AxiosAdapter,
    @InjectRepository(User)
    private readonly userRepository:Repository<User>
  ){}

  async create(createPaymentDto:CreatePaymentDto, user:User) {
    
    try {
      const suscription = await this.http.post<SuscriptionPayResponse>(
        `${this.baseUrlMP}/preapproval`,
        { ...createPaymentDto },
        this.configService.get('MP_ACCESS_TOKEN')
      )

      // Si se realiza el pago correctamente el usuario pasa a tener rol de premium
      if(suscription.status === 'authorized'){
        user.roles = [ValidRoles.USER_PREMIUM]
        await this.userRepository.save(user)
      }

      return suscription
      
    } catch (error) {
      console.log(error);
      
    }
  }

  async findAll() {
    try {
      const suscriptionPlans = await this.http.get<SearchSuscriptionPlansResponse>(
        `${this.baseUrlMP}/preapproval_plan/search`,
        this.configService.get('MP_ACCESS_TOKEN')
      )

      return suscriptionPlans;
      
    } catch (error) {
      console.log(error);
      
    }
  }

}
