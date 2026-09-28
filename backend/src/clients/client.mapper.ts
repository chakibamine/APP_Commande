import { Client } from '@prisma/client';

export function toClient(client: Client) {
  return {
    id: client.id,
    nom: client.nom,
    telephone: client.telephone,
    email: client.email,
    adresse: client.adresse,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}
