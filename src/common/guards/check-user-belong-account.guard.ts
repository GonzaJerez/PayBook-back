import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import {ValidRoles} from '../../auth/interfaces';

import { User } from '../../users/entities/user.entity';

/**
 * Valida que exista el id de la cuenta actual en las cuentas del usuario que hace peticion o sea admin
 */
@Injectable()
export class CheckUserBelongAccount implements CanActivate {

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const req = context.switchToHttp().getRequest();
    const idAccount = req.params.idAccount as string;
    const user = req.user as User;

    for (const userAccount of user.accounts) {
        if (userAccount.id === idAccount || user.roles.includes(ValidRoles.ADMIN)) {
            return true
        }
    }
    throw new NotFoundException(`Can't access to account`)
        
  }
}
