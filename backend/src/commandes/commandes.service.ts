import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StatutCommande } from '../common/enums/statut-commande.enum';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { TokenType } from '../common/enums/token-type.enum';
import { resolvePage, toPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { commandeInclude, toCommande } from './commande.mapper';
import { calculerMontantTotal, transitionAutorisee } from './commande.rules';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { ListCommandesQueryDto } from './dto/list-commandes-query.dto';

@Injectable()
export class CommandesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateCommandeDto) {
    const ids = dto.lignes.map((ligne) => ligne.produitId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'Chaque produit ne peut apparaître qu’une fois dans la commande',
      );
    }

    const commande = await this.prisma.$transaction(async (tx) => {
      const produits = await tx.produit.findMany({
        where: { id: { in: ids }, disponible: true },
      });
      if (produits.length !== ids.length) {
        throw new BadRequestException(
          'Un ou plusieurs produits sont indisponibles ou introuvables',
        );
      }

      const produitsById = new Map(
        produits.map((produit) => [produit.id, produit]),
      );
      const lignes = dto.lignes.map((ligne) => {
        const produit = produitsById.get(ligne.produitId);
        if (!produit) {
          throw new BadRequestException(
            'Un ou plusieurs produits sont indisponibles ou introuvables',
          );
        }
        return {
          produitId: produit.id,
          quantite: new Prisma.Decimal(ligne.quantite),
          prixUnitaireApplique: produit.prixUnitaire,
        };
      });

      const montantTotal = calculerMontantTotal(lignes);
      return tx.commande.create({
        data: {
          clientId,
          montantTotal,
          lignes: { create: lignes },
        },
        include: commandeInclude,
      });
    });

    return toCommande(commande);
  }

  async findMesCommandes(clientId: string, query: ListCommandesQueryDto) {
    const page = resolvePage(query.page, query.limit);
    const where: Prisma.CommandeWhereInput = { clientId };
    const [commandes, total] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        include: commandeInclude,
        skip: page.skip,
        take: page.take,
        orderBy: { dateCommande: 'desc' },
      }),
      this.prisma.commande.count({ where }),
    ]);
    return toPaginated(commandes.map(toCommande), total, page.page, page.limit);
  }

  async findAll(query: ListCommandesQueryDto) {
    const page = resolvePage(query.page, query.limit);
    const where: Prisma.CommandeWhereInput = query.statut
      ? { statut: query.statut }
      : {};
    const [commandes, total] = await Promise.all([
      this.prisma.commande.findMany({
        where,
        include: commandeInclude,
        skip: page.skip,
        take: page.take,
        orderBy: { dateCommande: 'desc' },
      }),
      this.prisma.commande.count({ where }),
    ]);
    return toPaginated(commandes.map(toCommande), total, page.page, page.limit);
  }

  async findOne(id: string, user: AuthUser) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      include: commandeInclude,
    });
    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }
    if (user.type === TokenType.CLIENT && commande.clientId !== user.id) {
      throw new ForbiddenException('Accès refusé à cette commande');
    }
    return toCommande(commande);
  }

  async changerStatut(id: string, statut: StatutCommande) {
    const commande = await this.prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      throw new NotFoundException('Commande introuvable');
    }
    if (!transitionAutorisee(commande.statut as StatutCommande, statut)) {
      throw new BadRequestException(
        `Transition de statut interdite : ${commande.statut} vers ${statut}`,
      );
    }
    const updated = await this.prisma.commande.update({
      where: { id },
      data: { statut },
      include: commandeInclude,
    });
    return toCommande(updated);
  }
}
