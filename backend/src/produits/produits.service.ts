import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CategorieProduit } from '../common/enums/categorie-produit.enum';
import { resolvePage, toPaginated } from '../common/utils/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { toProduit } from './produit.mapper';

@Injectable()
export class ProduitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto, includeUnavailable: boolean) {
    const page = resolvePage(query.page, query.limit);
    const where: Prisma.ProduitWhereInput = includeUnavailable
      ? {}
      : { disponible: true };
    const [produits, total] = await Promise.all([
      this.prisma.produit.findMany({
        where,
        skip: page.skip,
        take: page.take,
        orderBy: { nom: 'asc' },
      }),
      this.prisma.produit.count({ where }),
    ]);
    return toPaginated(produits.map(toProduit), total, page.page, page.limit);
  }

  async findOne(id: string) {
    const produit = await this.prisma.produit.findUnique({ where: { id } });
    if (!produit) {
      throw new NotFoundException('Produit introuvable');
    }
    return toProduit(produit);
  }

  async create(dto: CreateProduitDto) {
    const produit = await this.prisma.produit.create({
      data: {
        nom: dto.nom,
        unite: dto.unite,
        categorie: dto.categorie ?? CategorieProduit.AUTRE,
        prixUnitaire: new Prisma.Decimal(dto.prixUnitaire),
        disponible: dto.disponible ?? true,
      },
    });
    return toProduit(produit);
  }

  async update(id: string, dto: UpdateProduitDto) {
    await this.findOne(id);
    const produit = await this.prisma.produit.update({
      where: { id },
      data: {
        nom: dto.nom,
        unite: dto.unite,
        categorie: dto.categorie,
        disponible: dto.disponible,
        prixUnitaire:
          dto.prixUnitaire === undefined
            ? undefined
            : new Prisma.Decimal(dto.prixUnitaire),
      },
    });
    return toProduit(produit);
  }

  async remove(id: string) {
    await this.findOne(id);
    const lignes = await this.prisma.ligneCommande.count({
      where: { produitId: id },
    });
    if (lignes > 0) {
      const produit = await this.prisma.produit.update({
        where: { id },
        data: { disponible: false },
      });
      return { ...toProduit(produit), supprime: false };
    }
    await this.prisma.produit.delete({ where: { id } });
    return { id, supprime: true };
  }
}
