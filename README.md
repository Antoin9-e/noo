# Noo 💜🧡

Votre petit monde à deux : agenda partagé, envies à matcher, « Ce soir on fait quoi ? ».
PWA mobile (iPhone + Android), un seul service : Bun + Elysia + Prisma + PostgreSQL, front React + Vite.

## Démarrer en local

```bash
docker compose up -d                       # Postgres
cd backend && cp .env.example .env         # remplir BETTER_AUTH_SECRET (openssl rand -base64 32)
bun install && bun run db:migrate && bun run db:seed
bun run dev                                # API sur :3000

cd ../frontend && bun install && bun run dev   # http://localhost:5173 (proxy /api → :3000)
```

Comptes de démo : `toi@noo.dev` et `elle@noo.dev`, mot de passe `password123`.

Optionnel :
- `TMDB_API_KEY` : recherche de films/séries avec affiches (sinon saisie libre).
- `bun run vapid` (dans `backend/`) : clés pour les notifications push.

## Commandes

| Où | Commande | Rôle |
|---|---|---|
| backend | `bun test` | tests d'API (accès, foyer, agenda, envies, push, temps réel) |
| backend | `bun run typecheck` | TypeScript |
| frontend | `bun run build` | build PWA (types + Vite + service worker) |
| frontend | `bunx pwa-assets-generator` | régénère les icônes depuis `public/logo.svg` |

## Déploiement

Voir [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) (Vercel + Neon).
Le plan produit et technique est dans [PLAN_MVP.md](PLAN_MVP.md).
