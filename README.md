# BGI Commandes — commandes pétrolières

Gestion des clients, du catalogue (carburants, lubrifiants, gaz) et des commandes, avec prix en dirhams (DH).

```text
APP_Commande/
├── backend/    API NestJS + Prisma (SQL Server), authentification JWT
├── frontend/   React (Vite) : catalogue client et back-office
└── mobile/     Flutter (Android) : application client
```

## Backend

```bash
cd backend
cp .env.example .env   # puis renseigner DATABASE_URL et JWT_SECRET
npm install
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

- API : `http://localhost:3000/api`
- Swagger : `http://localhost:3000/api/docs`
- Compte admin de démonstration : `admin@petrole.local` / `Admin1234!`

### Base locale (SQL Server Express)

L’instance `localhost\SQLEXPRESS` sert au développement, avec la base `petrole_db` et le login `petrole_app`. Le port TCP est dynamique : s’il change après un redémarrage, relire le port dans le journal d’erreurs (`Server is listening on`) et mettre à jour `DATABASE_URL`.

### Alternative Docker

`docker compose up -d` (dans `backend/`) démarre SQL Server 2022 sur le port 1433. Créer la base avec `scripts/create-database.sql`, puis utiliser l’URL de `.env.example`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Le serveur Vite redirige `/api` vers `http://localhost:3000/api`. Back-office : `/admin/connexion`.

## Mobile

```bash
cd mobile
flutter pub get
flutter run
```

L’adresse de l’API vient de `--dart-define=API_BASE_URL=...` ; par défaut `mobile/lib/config.dart` vise l’IP du PC sur le réseau local (`http://192.168.1.2:3000/api`). Les comptes clients sont créés depuis le back-office ; connexion par téléphone et mot de passe.

## Déploiement

Staging (branche `staging`) et prod (branche `main`) sur Windows Server avec PM2 et GitHub Actions : voir [deploy/README.md](deploy/README.md).
