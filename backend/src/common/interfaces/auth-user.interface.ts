import { Role } from '../enums/role.enum';
import { TokenType } from '../enums/token-type.enum';

export interface AuthUser {
  id: string;
  type: TokenType;
  role?: Role;
  nom: string;
  email: string | null;
}
