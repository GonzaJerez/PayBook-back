import { ConfigService } from "@nestjs/config";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";

import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    constructor(
        @InjectRepository(User)
        private readonly userRepository:Repository<User>,
        configService:ConfigService
    ){
        // Config para el constructor del padre
        super({
            // key secreta de JWT
            secretOrKey: configService.get('JWT_SECRET'),
            // donde va a enviar el token el cliente
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }

    async validate(jwtPayload:JwtPayload):Promise<User>{
        const {id} = jwtPayload;

        // Busca usuario en DB por id
        const user = await this.userRepository.findOne({
            where:{id},
            relations:{accounts:true}
        })

        // Si no existe usuario con mail recibido en token
        if(!user)
            throw new UnauthorizedException(`Token not valid`)

        // Si el usuario está inactivo
        if(!user.isActive)
            throw new ForbiddenException(`User deleted. Contact the admin`)
        
        // Retorna el usuario, este va a estar disponible
        // en la req para todos mis endpoints
        return user;
    }
}