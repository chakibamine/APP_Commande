import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StatutCommande } from '../common/enums/statut-commande.enum';
import { CommandesService } from './commandes.service';
import { calculerMontantTotal, transitionAutorisee } from './commande.rules';

describe('règles de commande', () => {
  it('calcule le montant total côté serveur', () => {
    const total = calculerMontantTotal([
      { quantite: 200, prixUnitaireApplique: '1.5000' },
      { quantite: 50, prixUnitaireApplique: '2.0000' },
    ]);
    expect(total.toNumber()).toBe(400);
  });

  it('n’autorise que les transitions prévues', () => {
    expect(
      transitionAutorisee(StatutCommande.EN_ATTENTE, StatutCommande.CONFIRMEE),
    ).toBe(true);
    expect(
      transitionAutorisee(StatutCommande.EN_ATTENTE, StatutCommande.ANNULEE),
    ).toBe(true);
    expect(
      transitionAutorisee(StatutCommande.CONFIRMEE, StatutCommande.TERMINEE),
    ).toBe(true);
    expect(
      transitionAutorisee(StatutCommande.CONFIRMEE, StatutCommande.EN_ATTENTE),
    ).toBe(false);
    expect(
      transitionAutorisee(StatutCommande.TERMINEE, StatutCommande.ANNULEE),
    ).toBe(false);
    expect(
      transitionAutorisee(StatutCommande.ANNULEE, StatutCommande.CONFIRMEE),
    ).toBe(false);
  });
});

describe('CommandesService', () => {
  const tx = {
    produit: { findMany: jest.fn() },
    commande: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
    commande: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new CommandesService(prisma as never);

  const commandeEnregistree = {
    id: '11111111-1111-1111-1111-111111111111',
    clientId: '22222222-2222-2222-2222-222222222222',
    statut: StatutCommande.EN_ATTENTE,
    montantTotal: new Prisma.Decimal(400),
    dateCommande: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    client: {
      id: '22222222-2222-2222-2222-222222222222',
      nom: 'Atlas',
      telephone: '0612345678',
    },
    lignes: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        commandeId: '11111111-1111-1111-1111-111111111111',
        produitId: 'p1',
        quantite: new Prisma.Decimal(200),
        prixUnitaireApplique: new Prisma.Decimal('1.5'),
        produit: {
          id: 'p1',
          nom: 'Gasoil',
          unite: 'litre',
          categorie: 'CARBURANT',
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('copie le prix du produit et calcule le montant total', async () => {
    tx.produit.findMany.mockResolvedValue([
      {
        id: 'p1',
        prixUnitaire: new Prisma.Decimal('1.5000'),
        disponible: true,
      },
      {
        id: 'p2',
        prixUnitaire: new Prisma.Decimal('2.0000'),
        disponible: true,
      },
    ]);
    let payload:
      | {
          data: {
            montantTotal: Prisma.Decimal;
            lignes: {
              create: Array<{
                prixUnitaireApplique: Prisma.Decimal;
                quantite: Prisma.Decimal;
              }>;
            };
          };
        }
      | undefined;
    tx.commande.create.mockImplementation((input: typeof payload) => {
      payload = input;
      return Promise.resolve(commandeEnregistree);
    });

    await service.create('22222222-2222-2222-2222-222222222222', {
      lignes: [
        { produitId: 'p1', quantite: 200 },
        { produitId: 'p2', quantite: 50 },
      ],
    });

    if (!payload) {
      throw new Error('La commande n’a pas été créée');
    }
    expect(payload.data.montantTotal.toNumber()).toBe(400);
    expect(payload.data.lignes.create[0].prixUnitaireApplique.toNumber()).toBe(
      1.5,
    );
    expect(payload.data.lignes.create[1].quantite.toNumber()).toBe(50);
  });

  it('refuse un produit indisponible', async () => {
    tx.produit.findMany.mockResolvedValue([
      {
        id: 'p1',
        prixUnitaire: new Prisma.Decimal('1.5000'),
        disponible: true,
      },
    ]);

    await expect(
      service.create('client-1', {
        lignes: [
          { produitId: 'p1', quantite: 10 },
          { produitId: 'p2', quantite: 5 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.commande.create).not.toHaveBeenCalled();
  });

  it('refuse une transition de statut interdite', async () => {
    prisma.commande.findUnique.mockResolvedValue({
      id: 'c1',
      statut: StatutCommande.TERMINEE,
    });

    await expect(
      service.changerStatut('c1', StatutCommande.ANNULEE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.commande.update).not.toHaveBeenCalled();
  });
});
