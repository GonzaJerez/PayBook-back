import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {CheckUserBelongAccount} from '../guards/check-user-belong-account.guard';

/**
 * Valida que usuario este autenticado
 * y que la cuenta a la que se intenta acceder sea una cuenta a la que pertenece el usuario
 */
export function ValidUserToAccessAccount() {
  return applyDecorators(
    UseGuards(
      AuthGuard('jwt'), 
      CheckUserBelongAccount
    )
  );
}