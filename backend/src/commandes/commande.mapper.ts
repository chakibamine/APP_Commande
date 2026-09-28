import { Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/decimal';

export const commandeInclude = {
  client: {
    select: { id: true, nom: true, telephone: true },
  },
  lignes: {
    include: {
      produit: {
        select: { id: true, nom: true, unite: true, categorie: true },
      },
    },
  },
} satisfies Prisma.CommandeInclude;

export type CommandeWithLignes = Prisma.CommandeGetPayload<{
  include: typeof commandeInclude;
}>;

export function toCommande(commande: CommandeWithLignes) {
  return {
    id: commande.id,
    clientId: commande.clientId,
    statut: commande.statut,
    montantTotal: toNumber(commande.montantTotal),
    dateCommande: commande.dateCommande,
    updatedAt: commande.updatedAt,
    client: commande.client,
    lignes: commande.lignes.map((ligne) => ({
      id: ligne.id,
      produitId: ligne.produitId,
      quantite: toNumber(ligne.quantite),
      prixUnitaireApplique: toNumber(ligne.prixUnitaireApplique),
      produit: ligne.produit,
    })),
  };
}
