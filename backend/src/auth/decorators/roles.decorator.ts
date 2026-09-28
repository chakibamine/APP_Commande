import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { TokenType } from '../../common/enums/token-type.enum';

export const ROLES_KEY = 'roles';
export type AppRole = Role | TokenType.CLIENT;

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
