import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserRoleGuard, META_ROLES } from '../guards/user-role.guard';
import { ValidRoles } from '../interfaces';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    SetMetadata(META_ROLES, roles),
    UseGuards(AuthGuard('jwt'), UserRoleGuard),
  );
}
