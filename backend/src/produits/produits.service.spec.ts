import { Prisma } from '@prisma/client';
import { ProduitsService } from './produits.service';

describe('ProduitsService', () => {
  const prisma = {
    produit: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ligneCommande: {
      count: jest.fn(),
    },
  };
  const service = new ProduitsService(prisma as never);

  const produit = {
    id: 'p1',
    nom: 'Gasoil',
    unite: 'litre',
    prixUnitaire: new Prisma.Decimal('1.4500'),
    disponible: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ne liste que les produits disponibles pour un client', async () => {
    prisma.produit.findMany.mockResolvedValue([]);
    prisma.produit.count.mockResolvedValue(0);

    await service.findAll({}, false);

    expect(prisma.produit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { disponible: true } }),
    );
  });

  it('désactive un produit déjà présent dans une commande', async () => {
    prisma.produit.findUnique.mockResolvedValue(produit);
    prisma.ligneCommande.count.mockResolvedValue(3);
    prisma.produit.update.mockResolvedValue({ ...produit, disponible: false });

    const result = await service.remove('p1');

    expect(prisma.produit.delete).not.toHaveBeenCalled();
    expect(prisma.produit.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { disponible: false },
    });
    expect(result).toMatchObject({ disponible: false, supprime: false });
  });

  it('supprime un produit qui n’a jamais été commandé', async () => {
    prisma.produit.findUnique.mockResolvedValue(produit);
    prisma.ligneCommande.count.mockResolvedValue(0);

    const result = await service.remove('p1');

    expect(prisma.produit.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(result).toEqual({ id: 'p1', supprime: true });
  });
});
