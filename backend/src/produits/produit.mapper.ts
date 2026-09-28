import { Produit } from '@prisma/client';
import { toNumber } from '../common/utils/decimal';

export function toProduit(produit: Produit) {
  return {
    id: produit.id,
    nom: produit.nom,
    unite: produit.unite,
    categorie: produit.categorie,
    prixUnitaire: toNumber(produit.prixUnitaire),
    disponible: produit.disponible,
    createdAt: produit.createdAt,
    updatedAt: produit.updatedAt,
  };
}
