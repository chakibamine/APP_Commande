# Déploiement Windows Server (PM2 + GitHub Actions)

| Branche   | Environnement | Dossier serveur        | Process PM2   |
|-----------|---------------|------------------------|---------------|
| `staging` | staging       | `C:\BGI_cmd\staging`  | `bgi-staging` |
| `main`    | prod          | `C:\BGI_cmd\prod`     | `bgi-prod`    |

Chaque push lance la CI (backend, frontend, mobile). Si elle passe, le runner auto-hébergé du serveur construit le backend et le frontend, applique les migrations Prisma, copie le tout dans une nouvelle release, bascule `current` et recharge PM2. Si l’API ne répond pas après le rechargement, la release précédente est remise en place. Un APK Android pointant sur l’environnement est publié comme artefact du run.

NestJS sert l’API sous `/api` et le site React sur les autres chemins : un seul port par environnement.

## 1. Préparer le serveur (une fois)

1. Installer **Node.js 24 LTS** et **Git for Windows**.
2. Installer PM2 comme service Windows avec [pm2-installer](https://github.com/jessety/pm2-installer) (PowerShell administrateur) :

   ```powershell
   git clone https://github.com/jessety/pm2-installer C:\pm2-installer
   cd C:\pm2-installer
   npm run configure
   npm run setup
   ```

   PM2 démarre alors avec Windows, avec `PM2_HOME = C:\ProgramData\pm2\home` et `pm2` dans `C:\ProgramData\npm` (PATH machine). Le workflow utilise ce même `PM2_HOME`.

3. Créer les dossiers et les fichiers d’environnement :

   ```powershell
   New-Item -ItemType Directory -Force C:\BGI_cmd\staging, C:\BGI_cmd\prod
   ```

   `C:\BGI_cmd\staging\.env` :

   ```ini
   DATABASE_URL="sqlserver://localhost:1433;database=petrole_staging;user=petrole_app;password=...;encrypt=true;trustServerCertificate=true"
   JWT_SECRET=<longue chaîne aléatoire, différente de la prod>
   JWT_EXPIRES_IN=1d
   PORT=3001
   SEED_ADMIN_EMAIL=admin@bgi.ma
   SEED_ADMIN_PASSWORD=<mot de passe fort>
   ```

   `C:\BGI_cmd\prod\.env` : même format avec `database=petrole_prod`, un autre `JWT_SECRET`, `PORT=3000` et un autre mot de passe admin.

   À chaque déploiement, le compte admin `SEED_ADMIN_EMAIL` est créé s’il n’existe pas ; s’il existe déjà, son mot de passe n’est pas modifié. Pour le réinitialiser, ajouter `SEED_ADMIN_RESET=true`, redéployer, puis retirer la ligne.

   Ces fichiers restent sur le serveur ; ils ne sont jamais dans Git.

4. Créer les deux bases (`petrole_staging`, `petrole_prod`) et le login SQL (voir `backend/scripts/create-database.sql`).
5. Ouvrir les ports dans le pare-feu :

   ```powershell
   New-NetFirewallRule -DisplayName "BGI prod" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   New-NetFirewallRule -DisplayName "BGI staging" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
   ```

## 2. Installer le runner GitHub

Dans GitHub : **Settings → Actions → Runners → New self-hosted runner → Windows**, puis suivre les commandes affichées dans `C:\actions-runner`. Au `config.cmd` :

- labels supplémentaires : `bgi` (le workflow demande `self-hosted, windows, bgi`) ;
- répondre **Y** pour l’installer comme service ;
- compte du service : un compte administrateur local (ou un compte ayant les droits sur `C:\BGI_cmd` et `C:\ProgramData\pm2`).

Vérifier ensuite dans une console ouverte avec ce compte que `node -v`, `git --version` et `pm2 -v` répondent. Redémarrer le service du runner après une installation qui modifie le PATH.

## 3. Configurer GitHub

**Settings → Environments** :

- `staging` : variable `APP_URL` = `http://<serveur>:3001`.
- `prod` : variable `APP_URL` = `http://<serveur>:3000`, **Required reviewers** (validation manuelle avant chaque mise en prod) et **Deployment branches** limité à `main`.

**Settings → Secrets and variables → Actions → Variables** (niveau dépôt), pour l’APK :

- `STAGING_API_BASE_URL` = `http://<serveur>:3001/api`
- `PROD_API_BASE_URL` = `http://<serveur>:3000/api`

## 4. Premier déploiement

```powershell
git checkout -b staging
git push -u origin staging   # déploie staging
```

Le compte admin est créé pendant le déploiement à partir de `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` du `.env` (étape « Compte admin » dans le log).

Pour la prod : fusionner `staging` dans `main` (pull request), valider le déploiement dans l’onglet **Actions**.

## Exploitation

```powershell
$env:PM2_HOME = 'C:\ProgramData\pm2\home'
pm2 ls
pm2 logs bgi-staging
pm2 restart bgi-prod
```

Journaux : `C:\BGI_cmd\<env>\logs`. Les trois dernières releases sont conservées dans `C:\BGI_cmd\<env>\releases` ; pour revenir en arrière à la main, repointer `current` (`cmd /c rmdir current` puis `cmd /c mklink /J current releases\<release>`) et `pm2 reload bgi-<env>`.

Un déploiement peut aussi être lancé à la main : **Actions → Deploy → Run workflow**.
