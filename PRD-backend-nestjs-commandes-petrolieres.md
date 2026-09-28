# PRD – Backend NestJS
## Application de commande de produits pétroliers (gasoil, SSP, etc.)

**Version :** 1.0
**Portée :** Gestion des clients, produits et commandes uniquement (pas de paiement en ligne, pas de module de livraison/tracking).

---

## 1. Contexte et objectif

L'entreprise vend des produits pétroliers (gasoil, SSP, huiles, etc.) à ses clients. L'objectif est de développer un backend qui permette :

- aux **clients** de consulter le catalogue de produits et de passer des commandes,
- aux **administrateurs (back-office)** de gérer le catalogue et de traiter les commandes (confirmer, terminer, annuler).

Le paiement et la livraison ne font pas partie du périmètre de ce backend. Ils pourront être ajoutés dans une version future sans casser le modèle actuel.

## 2. Périmètre (scope)

**Inclus :**
- Authentification (clients + admins)
- Gestion des clients
- Gestion du catalogue produits
- Gestion des commandes (création, consultation, changement de statut)
- Back-office : validation/traitement des commandes, gestion produits

**Exclu (hors périmètre v1) :**
- Paiement en ligne
- Suivi de livraison / géolocalisation
- Notifications push/SMS (peut être ajouté plus tard)

## 3. Stack technique recommandée

| Composant | Choix |
|---|---|
| Framework | NestJS (Node.js + TypeScript) |
| Base de données | SQL Server |
| ORM | Prisma (`provider = "sqlserver"`) |
| Authentification | JWT (`@nestjs/jwt`, `passport-jwt`) |
| Validation | `class-validator`, `class-transformer` |
| Documentation API | Swagger (`@nestjs/swagger`) |
| Tests | Jest (unitaires) + Supertest (e2e) |
| Gestion config | `@nestjs/config` + fichier `.env` |

## 4. Structure des dossiers proposée

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       └── roles.decorator.ts
├── clients/
│   ├── clients.module.ts
│   ├── clients.controller.ts
│   ├── clients.service.ts
│   └── dto/
├── produits/
│   ├── produits.module.ts
│   ├── produits.controller.ts
│   ├── produits.service.ts
│   └── dto/
├── commandes/
│   ├── commandes.module.ts
│   ├── commandes.controller.ts
│   ├── commandes.service.ts
│   └── dto/
├── utilisateurs/            (comptes admin / back-office)
│   ├── utilisateurs.module.ts
│   ├── utilisateurs.controller.ts
│   └── utilisateurs.service.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   └── enums/
│       └── statut-commande.enum.ts
├── prisma/                  (ou database/ si TypeORM)
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── schema.prisma
├── config/
├── app.module.ts
└── main.ts
```

## 5. Modèle de données

### 5.1 Entité `Client`
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| nom | string | requis |
| telephone | string | requis, unique |
| email | string | optionnel, unique |
| adresse | string | requis |
| motDePasse | string (hashé) | requis |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto |

### 5.2 Entité `Utilisateur` (admin / back-office)
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| nom | string | requis |
| email | string | requis, unique |
| motDePasse | string (hashé) | requis |
| role | enum (`ADMIN`, `GESTIONNAIRE`) | requis |
| createdAt | timestamp | auto |

### 5.3 Entité `Produit`
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| nom | string | requis (ex : Gasoil, SSP) |
| unite | string | requis (ex : litre) |
| prixUnitaire | decimal | requis, > 0 |
| disponible | boolean | défaut `true` |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto |

### 5.4 Entité `Commande`
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| clientId | UUID | FK → Client |
| statut | enum (`EN_ATTENTE`, `CONFIRMEE`, `TERMINEE`, `ANNULEE`) | défaut `EN_ATTENTE` |
| montantTotal | decimal | calculé automatiquement |
| dateCommande | timestamp | auto |
| updatedAt | timestamp | auto |

### 5.5 Entité `LigneCommande`
| Champ | Type | Contraintes |
|---|---|---|
| id | UUID | PK |
| commandeId | UUID | FK → Commande |
| produitId | UUID | FK → Produit |
| quantite | decimal | requis, > 0 |
| prixUnitaireApplique | decimal | copié du produit au moment de la commande |

> **Note importante** : `prixUnitaireApplique` doit être copié depuis `Produit.prixUnitaire` au moment de la création de la commande, pour que l'historique des commandes ne soit pas affecté par un changement de prix ultérieur.

## 6. Règles métier

1. Un client ne peut commander que des produits `disponible = true`.
2. `montantTotal` d'une commande = somme de (`quantite` × `prixUnitaireApplique`) sur toutes ses lignes. Calculé côté serveur, jamais envoyé par le client.
3. Seul un `Utilisateur` avec le rôle `ADMIN` ou `GESTIONNAIRE` peut changer le statut d'une commande.
4. Transitions de statut autorisées :
   - `EN_ATTENTE` → `CONFIRMEE` ou `ANNULEE`
   - `CONFIRMEE` → `TERMINEE` ou `ANNULEE`
   - `TERMINEE` et `ANNULEE` sont des états finaux (non modifiables)
5. Une commande doit contenir au moins une ligne de commande.
6. Un client ne peut voir/modifier que ses propres commandes ; un admin voit toutes les commandes.

## 7. Endpoints API

### 7.1 Auth (`/auth`)
| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/auth/register-client` | Inscription client | Public |
| POST | `/auth/login-client` | Connexion client | Public |
| POST | `/auth/login-admin` | Connexion admin/back-office | Public |

### 7.2 Clients (`/clients`)
| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/clients/me` | Profil du client connecté | Client |
| PATCH | `/clients/me` | Modifier son profil | Client |
| GET | `/clients` | Liste de tous les clients | Admin |
| GET | `/clients/:id` | Détail d'un client | Admin |

### 7.3 Produits (`/produits`)
| Méthode | Route | Description | Accès |
|---|---|---|---|
| GET | `/produits` | Liste des produits disponibles | Public / Client |
| GET | `/produits/:id` | Détail d'un produit | Public / Client |
| POST | `/produits` | Créer un produit | Admin |
| PATCH | `/produits/:id` | Modifier un produit (prix, disponibilité) | Admin |
| DELETE | `/produits/:id` | Supprimer/désactiver un produit | Admin |

### 7.4 Commandes (`/commandes`)
| Méthode | Route | Description | Accès |
|---|---|---|---|
| POST | `/commandes` | Créer une commande (avec ses lignes) | Client |
| GET | `/commandes/mes-commandes` | Historique des commandes du client | Client |
| GET | `/commandes/:id` | Détail d'une commande | Client (propriétaire) / Admin |
| GET | `/commandes` | Liste de toutes les commandes (filtrable par statut) | Admin |
| PATCH | `/commandes/:id/statut` | Changer le statut d'une commande | Admin |

### Exemple de payload — création de commande
```json
POST /commandes
{
  "lignes": [
    { "produitId": "uuid-du-gasoil", "quantite": 200 },
    { "produitId": "uuid-du-ssp", "quantite": 50 }
  ]
}
```

## 8. Sécurité

- Mots de passe hashés avec `bcrypt`.
- Authentification par JWT (access token ; refresh token optionnel en v1).
- `RolesGuard` + décorateur `@Roles('ADMIN')` pour protéger les routes back-office.
- Validation stricte des DTO en entrée (`class-validator`) avec `whitelist: true` sur le `ValidationPipe` global pour rejeter les champs non attendus.
- Un client ne peut jamais définir lui-même `montantTotal`, `statut` ou `prixUnitaireApplique`.

## 9. Exigences non fonctionnelles

- Pagination sur les listes (`GET /produits`, `GET /commandes`, `GET /clients`) via `page` et `limit`.
- Format d'erreur standardisé via un `HttpExceptionFilter` global.
- Logging des requêtes (Nest Logger ou Winston).
- Documentation Swagger générée automatiquement, accessible sur `/api/docs`.
- Variables sensibles uniquement via `.env`, jamais en dur dans le code.

## 10. Variables d'environnement (`.env`)

```
DATABASE_URL="sqlserver://localhost:1433;database=petrole_db;user=sa;password=Your_strong_Password1;encrypt=true;trustServerCertificate=true"
JWT_SECRET=change_moi
JWT_EXPIRES_IN=1d
PORT=3000
```

## 11. Plan de tests

- Tests unitaires sur les services (`ProduitsService`, `CommandesService`) : calcul du montant total, transitions de statut interdites, produit indisponible.
- Tests e2e sur les endpoints critiques : création de commande, changement de statut, restrictions d'accès par rôle.

## 12. Definition of Done (v1)

- [ ] Auth client + admin fonctionnelle (JWT)
- [ ] CRUD produits (admin) + lecture publique
- [ ] Création et consultation de commandes (client)
- [ ] Gestion des statuts de commande (admin)
- [ ] Calcul automatique et sécurisé du montant total
- [ ] Validation des DTO sur toutes les routes
- [ ] Documentation Swagger disponible
- [ ] Tests unitaires + e2e passants
- [ ] Migrations de base de données versionnées (Prisma migrate ou TypeORM migrations)

---

### Instruction pour Cursor

> Génère un projet NestJS suivant exactement cette structure de dossiers, ces entités Prisma/TypeORM, ces endpoints et ces règles métier. Utilise TypeScript strict, `class-validator` pour les DTO, JWT pour l'authentification avec les rôles `CLIENT`, `ADMIN` et `GESTIONNAIRE`, et Swagger pour la documentation. Le paiement et la livraison ne doivent pas être implémentés dans cette version.
