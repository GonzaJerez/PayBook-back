import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import {ValidRoles} from '../../auth/interfaces';
import {User} from '../../users/entities/user.entity';

/**
 * Valida que la categoria a la que se intenta acceder esta activa
 */
@Injectable()
export class CheckCategoryActiveGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const req = context.switchToHttp().getRequest();
    const idAccount = req.params.idAccount as string;
    const idCategory = req.params.idCategory as string;
    const user = req.user as User;

    const isCategoryActive = user.accounts
      .find(account =>{
        return account.id === idAccount
      })?.categories
      .find( cat => {
        return cat.id === idCategory
      })?.
      isActive || user.roles.includes(ValidRoles.ADMIN)

    if(!isCategoryActive)
      throw new NotFoundException(`Cannot found category with id ${idCategory}`)
    
    return isCategoryActive;
  }
}
