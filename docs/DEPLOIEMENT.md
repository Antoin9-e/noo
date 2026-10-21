# 🚀 Déployer Noo (Vercel + Neon)

Un seul projet Vercel, deux services (`vercel.json` à la racine) : le front Vite sur le CDN,
l'API Elysia (runtime Bun) sur `/api/*`. Même URL HTTPS pour les deux : les cookies de session
restent first-party, ce qui évite les déconnexions sur iPhone.

Pas de serveur permanent sur Vercel, donc :
- **synchro entre vous deux** : le front refetch les données partagées toutes les 15 s quand l'app
  est ouverte, et dès qu'elle revient au premier plan (`frontend/src/lib/realtime.ts`) ;
- **rappels 1 h avant** : un cron externe appelle `/api/cron/reminders` chaque minute (voir 3.).

## 1. Base de données — Neon

Projet `fragrant-surf-95742136`, branche `production` (Francfort). Depuis `backend/` :
`npx neon@latest env pull` écrit `DATABASE_URL` (poolée, pour l'app) et `DATABASE_URL_UNPOOLED`
(directe, pour les migrations) dans `.env`.

## 2. App — Vercel

Projet `noo` → https://noo-eight.vercel.app (fonctions en `fra1`, à côté de Neon).

```bash
npx vercel deploy --prod      # depuis la racine du dépôt
```

Le build du backend lance `prisma migrate deploy` en production uniquement (`backend/scripts/vercel-build.sh`).
Pour déployer à chaque push : `npx vercel git connect`.

*Variables* (environnement Production) :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Neon poolée |
| `DATABASE_URL_UNPOOLED` | URL Neon directe |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -hex 24`, partagé avec le cron externe |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | `cd backend && bun run vapid` (facultatif : sans clés, pas de notifications push) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | console Google Cloud (facultatif) |
| `CLOUDINARY_*` | tes clés Cloudinary (photos de profil) |
| `TMDB_API_KEY` | https://www.themoviedb.org/settings/api (facultatif : sans clé, la recherche de films est désactivée) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | app sur https://developer.spotify.com, propriétaire Premium (facultatif : sans clés, on colle un lien au lieu de chercher un morceau) |

`BETTER_AUTH_URL` et `APP_ORIGIN` valent par défaut l'URL de prod fournie par Vercel
(`VERCEL_PROJECT_PRODUCTION_URL`) : à définir seulement avec un domaine perso.

Les previews n'ont pas de variables (elles partageraient la base de prod) : seule la prod est configurée.

## 3. Rappels — cron externe

Le cron de Vercel en Hobby ne tourne qu'une fois par jour. Sur https://cron-job.org (gratuit) :
- URL : `https://noo-eight.vercel.app/api/cron/reminders`, toutes les minutes ;
- en-tête `Authorization: Bearer <CRON_SECRET>`.

## 4. Google OAuth (si utilisé)

Dans la console Google Cloud, ajoute l'URI de redirection autorisée :
`https://noo-eight.vercel.app/api/auth/callback/google`

> Sur iPhone, en PWA installée, l'OAuth s'ouvre dans Safari (cookies séparés).
> Le bouton Google est donc masqué dans la PWA iOS : utilisez email + mot de passe.

## 5. Installer sur les téléphones

- **Android (Chrome)** : ouvrir l'URL → bandeau « Installe Noo » ou menu ⋮ → *Installer l'application*.
- **iPhone (Safari)** : ouvrir l'URL → *Partager* → *Sur l'écran d'accueil*.

Une fois le dépôt connecté (`npx vercel git connect`), chaque `git push` sur `main` redéploie : l'app se met à jour toute seule à la prochaine ouverture.

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
