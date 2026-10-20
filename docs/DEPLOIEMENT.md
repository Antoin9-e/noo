# 🚀 Déployer Noo (Railway + Neon)

Un seul service : Elysia sert l'API **et** le front buildé, sur une seule URL HTTPS.
Les cookies de session restent first-party, ce qui évite les déconnexions sur iPhone.

## 1. Base de données — Neon

1. Crée un projet sur https://neon.tech (région Europe, Francfort par exemple).
2. Récupère deux chaînes de connexion :
   - **poolée** (hôte avec `-pooler`) → `DATABASE_URL`
   - **directe** (sans `-pooler`) → `DIRECT_URL` (utilisée par les migrations)

## 2. App — Railway

1. https://railway.app → *New project* → *Deploy from GitHub repo* → ce dépôt.
2. Railway détecte le `Dockerfile` à la racine. Rien d'autre à configurer pour le build.
3. *Settings → Networking → Generate domain* : tu obtiens `https://noo-xxx.up.railway.app`
   (ou branche ton propre domaine).
4. *Variables* :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Neon poolée |
| `DIRECT_URL` | URL Neon directe |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://noo-xxx.up.railway.app` |
| `APP_ORIGIN` | la même URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | console Google Cloud (facultatif) |
| `CLOUDINARY_*` | tes clés Cloudinary |
| `TMDB_API_KEY` | https://www.themoviedb.org/settings/api (facultatif : sans clé, la recherche de films est désactivée) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | `cd backend && bun run vapid` (facultatif : sans clés, pas de notifications push) |

Railway fournit `PORT` tout seul. Au démarrage, le conteneur applique les migrations
(`prisma migrate deploy`) puis lance le serveur.

## 3. Google OAuth (si utilisé)

Dans la console Google Cloud, ajoute l'URI de redirection autorisée :
`https://noo-xxx.up.railway.app/api/auth/callback/google`

> Sur iPhone, en PWA installée, l'OAuth s'ouvre dans Safari (cookies séparés).
> Le bouton Google est donc masqué dans la PWA iOS : utilisez email + mot de passe.

## 4. Installer sur les téléphones

- **Android (Chrome)** : ouvrir l'URL → bandeau « Installe Noo » ou menu ⋮ → *Installer l'application*.
- **iPhone (Safari)** : ouvrir l'URL → *Partager* → *Sur l'écran d'accueil*.

Chaque `git push` redéploie : l'app se met à jour toute seule à la prochaine ouverture.

## Dev local

```bash
docker compose up -d                 # Postgres
cd backend && cp .env.example .env   # puis remplir BETTER_AUTH_SECRET
bun install && bun run db:migrate && bun run db:seed
bun run dev                          # API sur :3000

cd ../frontend && bun install && bun run dev   # front sur :5173 (proxy /api → :3000)
```

Comptes de dev : `toi@noo.dev` / `elle@noo.dev`, mot de passe `password123`.

Sur le téléphone (même wifi) : `http://<ip-du-pc>:5173` (sans service worker, il faut HTTPS).
Pour tester la PWA complète : `cloudflared tunnel --url http://localhost:5173`.
