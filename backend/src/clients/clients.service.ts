import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterClientDto } from '../auth/dto/register-client.dto';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { resolvePage, toPaginated } from '../common/utils/pagination';
import { rethrowUniqueConflict } from '../common/utils/prisma-error';
import { PrismaService } from '../prisma/prisma.service';
import { toClient } from './client.mapper';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client introuvable');
    }
    return toClient(client);
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    const data: UpdateClientDto & { motDePasse?: string } = { ...dto };
    if (dto.motDePasse) {
      data.motDePasse = await bcrypt.hash(dto.motDePasse, 10);
    }
    try {
      const client = await this.prisma.client.update({
        where: { id },
        data,
      });
      return toClient(client);
    } catch (error) {
      rethrowUniqueConflict(error, 'Téléphone ou email déjà utilisé');
    }
  }

  async create(dto: RegisterClientDto) {
    try {
      const client = await this.prisma.client.create({
        data: {
          nom: dto.nom,
          telephone: dto.telephone,
          email: dto.email,
          adresse: dto.adresse,
          motDePasse: await bcrypt.hash(dto.motDePasse, 10),
        },
      });
      return toClient(client);
    } catch (error) {
      rethrowUniqueConflict(error, 'Téléphone ou email déjà utilisé');
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    const commandes = await this.prisma.commande.count({
      where: { clientId: id },
    });
    if (commandes > 0) {
      throw new ConflictException(
        `Ce client a ${commandes} commande${commandes > 1 ? 's' : ''} : suppression impossible.`,
      );
    }
    await this.prisma.client.delete({ where: { id } });
    return { id, supprime: true };
  }

  async findAll(query: PaginationQueryDto) {
    const page = resolvePage(query.page, query.limit);
    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        skip: page.skip,
        take: page.take,
        orderBy: { nom: 'asc' },
      }),
      this.prisma.client.count(),
    ]);
    return toPaginated(clients.map(toClient), total, page.page, page.limit);
  }
}
