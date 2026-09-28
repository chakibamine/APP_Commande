import { Role } from '../enums/role.enum';
import { TokenType } from '../enums/token-type.enum';

export interface JwtPayload {
  sub: string;
  type: TokenType;
  role?: Role;
}
