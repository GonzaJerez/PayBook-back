import { applyDecorators, UseGuards } from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {CheckUserBelongAccount} from '../../common/guards/check-user-belong-account.guard';
import {CheckCategoryActiveGuard} from '../guards/check-category-active.guard';

/**
 * Valida que usuario este autenticado
 * que la cuenta a la que se intenta acceder sea una cuenta a la que pertenece el usuario
 * y que la categoria a la que se intenta acceder esta activa
 */
export const ValidUserToAccessCategory = () => {
    return applyDecorators(
        UseGuards(
            AuthGuard('jwt'), 
            CheckUserBelongAccount,
            CheckCategoryActiveGuard
        )
    );
}
