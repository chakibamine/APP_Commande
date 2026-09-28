import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Client, Utilisateur } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import { TokenType } from '../common/enums/token-type.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { rethrowUniqueConflict } from '../common/utils/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { toClient } from '../clients/client.mapper';
import { LoginAdminDto } from './dto/login-admin.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterClientDto } from './dto/register-client.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerClient(dto: RegisterClientDto) {
    const motDePasse = await bcrypt.hash(dto.motDePasse, BCRYPT_ROUNDS);
    try {
      const client = await this.prisma.client.create({
        data: {
          nom: dto.nom,
          telephone: dto.telephone,
          email: dto.email,
          adresse: dto.adresse,
          motDePasse,
        },
      });
      return this.buildClientResponse(client);
    } catch (error) {
      rethrowUniqueConflict(error, 'Téléphone ou email déjà utilisé');
    }
  }

  async loginClient(dto: LoginClientDto) {
    const client = await this.prisma.client.findUnique({
      where: { telephone: dto.telephone },
    });
    if (!client || !(await bcrypt.compare(dto.motDePasse, client.motDePasse))) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.buildClientResponse(client);
  }

  async loginAdmin(dto: LoginAdminDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
    });
    if (
      !utilisateur ||
      !(await bcrypt.compare(dto.motDePasse, utilisateur.motDePasse))
    ) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return this.buildStaffResponse(utilisateur);
  }

  private buildClientResponse(client: Client) {
    const payload: JwtPayload = { sub: client.id, type: TokenType.CLIENT };
    return {
      accessToken: this.sign(payload),
      type: TokenType.CLIENT,
      profil: toClient(client),
    };
  }

  private buildStaffResponse(utilisateur: Utilisateur) {
    const payload: JwtPayload = {
      sub: utilisateur.id,
      type: TokenType.STAFF,
      role: utilisateur.role as Role,
    };
    return {
      accessToken: this.sign(payload),
      type: TokenType.STAFF,
      profil: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        email: utilisateur.email,
        role: utilisateur.role,
        createdAt: utilisateur.createdAt,
      },
    };
  }

  private sign(payload: JwtPayload): string {
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '1d') as JwtSignOptions['expiresIn'];
    return this.jwtService.sign(payload, { expiresIn });
  }
}
