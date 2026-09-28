import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { StatutCommande } from '../src/common/enums/statut-commande.enum';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

function asBody<T>(body: unknown): T {
  return body as T;
}

describe('Commandes (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication<App>;
  let clientToken = '';
  let adminToken = '';
  let produitId = '';
  let commandeId = '';
  const telephone = `06${Date.now().toString().slice(-8)}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login-admin')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@petrole.local',
        motDePasse: process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!',
      })
      .expect(200);

    adminToken = asBody<{ accessToken: string }>(adminLogin.body).accessToken;

    const register = await request(app.getHttpServer())
      .post('/auth/register-client')
      .send({
        nom: 'Client E2E',
        telephone,
        email: `${telephone}@example.com`,
        adresse: 'Zone industrielle',
        motDePasse: 'Client1234',
      })
      .expect(201);

    clientToken = asBody<{ accessToken: string }>(register.body).accessToken;
  });

  afterAll(async () => {
    const prisma = new PrismaClient();
    const client = await prisma.client.findUnique({ where: { telephone } });
    if (client) {
      await prisma.commande.deleteMany({ where: { clientId: client.id } });
      await prisma.client.delete({ where: { id: client.id } });
    }
    if (produitId) {
      await prisma.produit.delete({ where: { id: produitId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('refuse au client l’accès à la liste des clients', () => {
    return request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
  });

  it('crée un produit, une commande, puis change le statut', async () => {
    const produit = await request(app.getHttpServer())
      .post('/produits')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nom: `Gasoil e2e ${telephone}`,
        unite: 'litre',
        prixUnitaire: 1.5,
      })
      .expect(201);

    produitId = asBody<{ id: string }>(produit.body).id;

    const interdit = await request(app.getHttpServer())
      .post('/commandes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        montantTotal: 1,
        statut: 'TERMINEE',
        lignes: [{ produitId, quantite: 200 }],
      });
    expect(interdit.status).toBe(400);

    const commande = await request(app.getHttpServer())
      .post('/commandes')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ lignes: [{ produitId, quantite: 200 }] })
      .expect(201);

    const created = asBody<{
      id: string;
      montantTotal: number;
      statut: string;
      lignes: Array<{ prixUnitaireApplique: number }>;
    }>(commande.body);
    commandeId = created.id;
    expect(created.montantTotal).toBe(300);
    expect(created.statut).toBe(StatutCommande.EN_ATTENTE);
    expect(created.lignes[0].prixUnitaireApplique).toBe(1.5);

    const statutClient = await request(app.getHttpServer())
      .patch(`/commandes/${commandeId}/statut`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ statut: StatutCommande.CONFIRMEE });
    expect(statutClient.status).toBe(403);

    const confirmee = await request(app.getHttpServer())
      .patch(`/commandes/${commandeId}/statut`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: StatutCommande.CONFIRMEE })
      .expect(200);
    expect(asBody<{ statut: string }>(confirmee.body).statut).toBe(
      StatutCommande.CONFIRMEE,
    );

    const retour = await request(app.getHttpServer())
      .patch(`/commandes/${commandeId}/statut`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: StatutCommande.EN_ATTENTE });
    expect(retour.status).toBe(400);
  });

  it('permet au client de consulter sa commande', async () => {
    const detail = await request(app.getHttpServer())
      .get(`/commandes/${commandeId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect(asBody<{ id: string }>(detail.body).id).toBe(commandeId);
  });
});
