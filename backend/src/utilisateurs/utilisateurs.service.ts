import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Utilisateur } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

export function toStaff(utilisateur: Utilisateur) {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    email: utilisateur.email,
    role: utilisateur.role,
    createdAt: utilisateur.createdAt,
  };
}

@Injectable()
export class UtilisateursService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.utilisateur.findUnique({ where: { email } });
  }

  private async get(id: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id },
    });
    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return utilisateur;
  }

  async findMe(id: string) {
    return toStaff(await this.get(id));
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    const utilisateur = await this.get(id);
    const data: { nom?: string; motDePasse?: string } = {};
    if (dto.nom !== undefined) {
      data.nom = dto.nom.trim();
    }
    if (dto.motDePasse) {
      const ok =
        dto.motDePasseActuel !== undefined &&
        (await bcrypt.compare(dto.motDePasseActuel, utilisateur.motDePasse));
      if (!ok) {
        throw new BadRequestException('Mot de passe actuel incorrect');
      }
      data.motDePasse = await bcrypt.hash(dto.motDePasse, 10);
    }
    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data,
    });
    return toStaff(updated);
  }
}
