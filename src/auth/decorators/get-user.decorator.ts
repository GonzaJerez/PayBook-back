import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "../../users/entities/user.entity";

/**
 * Decorador de parametro para obtener el usuario de la req
 */
export const GetUser = createParamDecorator(
    (data:keyof User,ctx:ExecutionContext)=>{
        
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        return (data)
            ? user[data]
            : user
    }
)