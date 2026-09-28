import { Prisma } from '@prisma/client';
import { StatutCommande } from '../common/enums/statut-commande.enum';

const TRANSITIONS: Record<StatutCommande, StatutCommande[]> = {
  EN_ATTENTE: [StatutCommande.CONFIRMEE, StatutCommande.ANNULEE],
  CONFIRMEE: [StatutCommande.TERMINEE, StatutCommande.ANNULEE],
  TERMINEE: [],
  ANNULEE: [],
};

export function transitionAutorisee(
  actuel: StatutCommande,
  suivant: StatutCommande,
): boolean {
  return TRANSITIONS[actuel].includes(suivant);
}

export function calculerMontantTotal(
  lignes: Array<{
    quantite: Prisma.Decimal.Value;
    prixUnitaireApplique: Prisma.Decimal.Value;
  }>,
): Prisma.Decimal {
  const total = lignes.reduce((somme, ligne) => {
    return somme.plus(
      new Prisma.Decimal(ligne.quantite).mul(ligne.prixUnitaireApplique),
    );
  }, new Prisma.Decimal(0));
  return total.toDecimalPlaces(4);
}
