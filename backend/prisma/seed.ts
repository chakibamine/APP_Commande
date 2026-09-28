import { PrismaClient } from '@prisma/client';
import { Role } from '../src/common/enums/role.enum';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@petrole.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const motDePasse = await bcrypt.hash(password, 10);

  await prisma.utilisateur.upsert({
    where: { email },
    update: { motDePasse, role: Role.ADMIN, nom: 'Administrateur' },
    create: {
      nom: 'Administrateur',
      email,
      motDePasse,
      role: Role.ADMIN,
    },
  });

  const produits = [
    {
      nom: 'Gasoil',
      unite: 'litre',
      categorie: 'CARBURANT',
      prixUnitaire: '1.4500',
    },
    { nom: 'SSP', unite: 'litre', categorie: 'CARBURANT', prixUnitaire: '1.6200' },
  ];

  for (const produit of produits) {
    const existing = await prisma.produit.findFirst({
      where: { nom: produit.nom },
    });
    if (!existing) {
      await prisma.produit.create({
        data: {
          nom: produit.nom,
          unite: produit.unite,
          categorie: produit.categorie,
          prixUnitaire: produit.prixUnitaire,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
