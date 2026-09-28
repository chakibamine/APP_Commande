import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { TokenType } from '../../common/enums/token-type.enum';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type === TokenType.CLIENT) {
      const client = await this.prisma.client.findUnique({
        where: { id: payload.sub },
      });
      if (!client) {
        throw new UnauthorizedException('Session invalide');
      }
      return {
        id: client.id,
        type: TokenType.CLIENT,
        nom: client.nom,
        email: client.email,
      };
    }

    if (payload.type === TokenType.STAFF) {
      const utilisateur = await this.prisma.utilisateur.findUnique({
        where: { id: payload.sub },
      });
      if (!utilisateur) {
        throw new UnauthorizedException('Session invalide');
      }
      return {
        id: utilisateur.id,
        type: TokenType.STAFF,
        role: utilisateur.role as AuthUser['role'],
        nom: utilisateur.nom,
        email: utilisateur.email,
      };
    }

    throw new UnauthorizedException('Session invalide');
  }
}
