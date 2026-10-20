# 📱 Plan MVP — Noo (PWA pour couple)

> Plan d'exécution détaillé. Remplace les phases 2 à 8 de `PLAN_PROJET_SIMPLIFIE.md`.
> Décidé lors du brainstorm du 2026-10-20.

---

## 0. Vision & décisions

**Pour qui** : Antoine et sa copine (2 personnes, un iPhone et un Android). La famille viendra peut-être plus tard : le modèle de données reste multi-membres, mais l'UX est pensée pour deux.

**Forme** : **PWA**, utilisée à 99 % sur téléphone, installée sur l'écran d'accueil. Le bureau n'est pas une cible : l'app y reste juste « pas cassée ».

**Objectif d'expérience** : intuitive, rapide, *addictive* (dans le bon sens). On doit avoir envie de l'ouvrir.

### Décisions validées

| Sujet | Décision |
|---|---|
| Plateforme | PWA (pas d'Expo : iPhone + Android, pas de compte Apple payant) |
| Backend | On garde Bun + Elysia + Prisma + PostgreSQL + Better-Auth |
| Temps réel | WebSocket Elysia → invalidation des caches TanStack Query |
| Couleurs | **Toi = violet · Elle = orange · Vous deux = dégradé violet→orange** (le chevauchement du logo) |
| Écrans MVP | Aujourd'hui · Agenda · Envies (+ bouton d'ajout central) |
| Envies | Catégories + **mode Match** + **« Ce soir on fait quoi ? »** |
| Langue | Français uniquement, tutoiement, ton chaleureux |

### En attente de l'utilisateur

- [ ] **Site d'inspiration design** : on en reprend le code couleur et l'ambiance (voir §3)
- [ ] Direction visuelle finale : A « Crépuscule » / B « Lumière douce » / C « Du lever au coucher »
- [ ] Le logo **sans le texte** (symbole seul, idéalement en SVG) pour les icônes d'app
- [ ] Clé API TMDB (gratuite : https://www.themoviedb.org/settings/api)
- [ ] Comptes d'hébergement (voir §6)
- [ ] OK pour supprimer `my-app/` (boilerplate Next.js inutilisé)

---

## 1. État des lieux (au 2026-10-20)

**Déjà fait** : auth email/mot de passe et Google (Better-Auth), page profil, upload d'avatar (Cloudinary), schéma Family/IsMember/IsResponsible, seed, `GET /api/families[/:id]`, `GET /api/users[/:id]`.

**Problèmes à corriger d'abord** (Phase 1) :

| # | Problème | Où |
|---|---|---|
| 1 | `GET /api/users` et `GET /api/families` sont publics et renvoient **tous** les users/emails | `backend/src/routes/user.ts`, `family.ts` |
| 2 | L'upload d'avatar fait confiance à `body.userId` : on peut changer l'avatar de n'importe qui | `backend/src/routes/upload_avatar.ts` |
| 3 | `IsResponsible` + `@@unique([familyId])` : un seul responsable par famille, et ça fait doublon avec `IsMember` | `schema.prisma` |
| 4 | `.gitignore` racine ignore `prisma/migrations/**/migration.sql` : **les nouvelles migrations ne seront jamais commitées** | `.gitignore` |
| 5 | 3 instances `PrismaClient` différentes (auth, seed, families seed) | `lib/auth.ts`, `prisma/seed*.ts` |
| 6 | URLs `http://localhost:3000` / `5173` codées en dur (front + CORS + trustedOrigins) | front partout, `index.ts`, `lib/auth.ts` |
| 7 | `/profile` et `/families/:id` déclarées hors `ProtectedRoute` ; le `return <Navigate>` dans un `useEffect` de `FamilyDashboard` ne fait rien | `frontend/src/routes/index.tsx`, `FamilyDashboard.tsx` |
| 8 | Thème shadcn resté en gris par défaut, `colors.ts` ne correspond ni au logo ni à la page de connexion, `App.css` = résidu du template Vite | front |
| 9 | Layout pensé desktop (`w-[45%]`, `w-[65%]`, header horizontal) | pages auth / profil |

**Environnement local** : `bun` n'est pas installé, il n'y a pas de `.env`, Docker est disponible. Variables Prisma attendues : `DATABASE_URL` (runtime) **et** `DIRECT_URL` (migrations, cf. `prisma.config.ts`).

---

## 2. Architecture cible

### 2.1 Une seule origine (choix important)

En prod, **Elysia sert aussi le build du front** (`frontend/dist`) : un seul service, une seule URL HTTPS.

Pourquoi :
- Les cookies de session Better-Auth restent *first-party*. Avec front et back sur deux domaines (vercel.app + railway.app), Safari iOS bloque les cookies tiers → déconnexions.
- Plus de CORS, plus d'URLs codées en dur : le front appelle `/api/...` en relatif.

En dev : Vite proxifie `/api` et `/ws` vers `localhost:3000`.

```ts
// frontend/vite.config.ts (extrait)
server: {
  host: true, // accessible depuis le téléphone sur le même wifi
  proxy: {
    "/api": "http://localhost:3000",
    "/ws": { target: "ws://localhost:3000", ws: true },
  },
},
```

```ts
// frontend/src/lib/auth-client.ts
export const authClient = createAuthClient({ baseURL: window.location.origin });
```

### 2.2 Backend — organisation par modules

```
backend/
├── index.ts                    # assemble les modules, sert le front en prod
└── src/
    ├── lib/
    │   ├── prisma.ts           # UNIQUE PrismaClient (réutilisé par auth + seed)
    │   ├── auth.ts             # Better-Auth (importe prisma depuis ./prisma)
    │   ├── cloudinary.ts
    │   └── env.ts              # lecture + validation des variables d'env
    ├── plugins/
    │   ├── auth-guard.ts       # macro `auth: true` → { user, session } ou 401
    │   └── family-guard.ts     # helper requireMembership(userId, familyId) → 403
    └── modules/
        ├── me/routes.ts        # profil, avatar
        ├── family/routes.ts    # foyer, membres, invitations
        ├── events/routes.ts
        ├── wishes/routes.ts    # envies, votes, matchs, notes
        ├── search/routes.ts    # proxy TMDB
        ├── activity/           # routes.ts + record.ts (helper d'écriture)
        └── realtime/ws.ts      # WebSocket + publish(familyId, keys)
```

**Guard d'authentification** (pattern documenté par Better-Auth pour Elysia) :

```ts
// src/plugins/auth-guard.ts
export const authGuard = new Elysia({ name: "auth-guard" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401);
      return { user: session.user, session: session.session };
    },
  },
});
// usage : .get("/me", ({ user }) => user, { auth: true })
```

**Règle** : chaque route qui touche un `familyId` appelle `requireMembership(user.id, familyId)`, qui lève une 403 si l'utilisateur n'est pas membre. Validation des body avec `t` d'Elysia (déjà utilisé dans `upload_avatar.ts`).

### 2.3 Frontend — organisation par features

```
frontend/src/
├── app/
│   ├── App.tsx                 # Providers (QueryClient, Router, Toaster)
│   ├── routes.tsx
│   └── AppShell.tsx            # layout mobile : contenu + TabBar + FAB
├── features/
│   ├── auth/                   # (déplacer components/Auth ici)
│   ├── household/              # onboarding, invitation, rejoindre, réglages
│   ├── today/
│   ├── agenda/
│   ├── wishes/                 # listes, match (swipe), ce-soir, fiche
│   └── quick-add/              # bottom sheet du bouton +
├── components/
│   ├── ui/                     # shadcn
│   └── common/                 # PersonDot, PersonBadge, EmptyState, Avatar…
├── lib/
│   ├── api.ts                  # wrapper fetch : base "/api", credentials, erreurs typées
│   ├── realtime.ts             # client WebSocket + invalidation TanStack Query
│   ├── person-color.ts         # couleur d'un membre / d'un ensemble de membres
│   └── dates.ts                # helpers date-fns (fr) + fuseau Europe/Paris
├── stores/
│   └── household.ts            # zustand persist : activeFamilyId
└── sw.ts                       # service worker (vite-plugin-pwa, injectManifest)
```

- Données serveur → **uniquement TanStack Query** (fini les `useEffect` + `fetch`). Un fichier `api.ts` + `hooks.ts` par feature.
- Mutations → **optimistic updates** systématiques (cocher, voter, réagir doivent être instantanés).
- `@elysiajs/eden` (type-safe) : non retenu pour l'instant, ça couple les builds front et back. Les types partagés vivent dans `frontend/src/types`.

### 2.4 Temps réel

- `GET /ws` (WebSocket Elysia/Bun). À la connexion : vérification de la session via les headers/cookie, puis `ws.subscribe("family:" + familyId)` pour chaque foyer de l'utilisateur.
- Après chaque mutation, le backend appelle `publish(familyId, { type: "invalidate", keys: [["wishes"], ["activity"]] })`.
- Le client appelle `queryClient.invalidateQueries({ queryKey })` pour chaque clé. Reconnexion automatique (backoff), et `refetchOnWindowFocus` reste actif en filet de sécurité.

C'est simple et robuste : le serveur ne pousse pas de données, juste « ça a changé ».

---

## 3. Design system

### 3.1 Couleurs par personne (validé)

Chaque `Membership` a une `color` (`VIOLET` | `ORANGE`, extensible plus tard pour la famille).

| Sens | Rendu |
|---|---|
| Un élément d'une seule personne | sa couleur (point, bordure gauche, avatar cerclé) |
| Un élément commun / un match | **dégradé violet → orange** |
| Action de l'autre dans le fil | couleur de l'autre |

`lib/person-color.ts` expose `colorFor(memberIds: string[], members)` → `"violet" | "orange" | "both"`, et les classes Tailwind correspondantes. **Toute l'UI passe par ce helper**, jamais de couleur de personne en dur.

### 3.2 Tokens (provisoires, à caler sur le site d'inspiration)

Valeurs de départ tirées de la page de connexion et du logo :

```css
/* frontend/src/index.css — à remplacer dans :root (thème shadcn) */
--noo-violet: #6d28d9;      /* toi */
--noo-violet-deep: #1e0a3c; /* fond nuit */
--noo-orange: #f97316;      /* elle */
--noo-peach: #fdba74;
--noo-gradient: linear-gradient(135deg, var(--noo-violet), var(--noo-orange));
```

- Mapper `--primary`, `--ring`, `--accent`, `--background`… de shadcn sur ces tokens (avec `oklch`, comme le reste du fichier).
- Supprimer `App.css`. Réécrire `lib/colors.ts` (ou le supprimer au profit des variables CSS).
- **Typo** : Space Grotesk (titres, déjà chargée en 700) + une police de texte très lisible (proposition : DM Sans 400/500/700). À confirmer avec l'inspiration.
- Rayons généreux (cartes `rounded-3xl`), ombres douces, beaucoup d'air.
- **Direction A / B / C** : les tokens sont des variables CSS. La direction C (« du lever au coucher ») consiste juste à basculer `data-theme="day" | "evening"` sur `<html>` selon l'heure (≥ 19h → soir). Elle peut donc venir en bonus sans rien casser.

> 🔜 **Quand l'utilisateur donne le site d'inspiration** : extraire la palette (fond, surfaces, texte, accents), la typo, les rayons et les ombres. Les traduire en tokens ci-dessus, garder violet/orange/dégradé pour les personnes, et montrer un écran Aujourd'hui de test avant de généraliser.

### 3.3 Règles d'ergonomie mobile (non négociables)

- Zones tactiles ≥ 44 px. Actions principales en bas de l'écran (à portée du pouce).
- `font-size` ≥ 16 px sur tous les `<input>` (sinon iOS zoome).
- `100dvh` au lieu de `100vh` ; padding `env(safe-area-inset-*)` (encoche, barre home).
- `overscroll-behavior: none` sur `body`, `-webkit-tap-highlight-color: transparent`.
- Feedback immédiat sur chaque tap : état pressé, optimistic update, `navigator.vibrate(10)` quand c'est dispo (Android ; iOS l'ignore).
- Formulaires : un champ visible par défaut, le reste dans « Plus d'options ».
- Bottom sheets (shadcn `drawer`, basé sur vaul) plutôt que des modales centrées.
- États vides soignés et engageants (« Aucune envie pour l'instant — ajoute le premier film ! »).
- Squelettes de chargement, pas de spinners plein écran.

---

## 4. Modèle de données (Prisma)

> Pas de données de prod, donc on fait un `prisma migrate reset` et on reseed, sans migration de données.

```prisma
enum Role        { ADMIN MEMBER }
enum PersonColor { VIOLET ORANGE }

model Family {                          // affiché « Foyer » dans l'UI
  id          String       @id @default(uuid())
  name        String
  timezone    String       @default("Europe/Paris")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  memberships Membership[]
  invitations Invitation[]
  events      Event[]
  wishes      Wish[]
  activities  Activity[]
}

model Membership {                      // remplace IsMember + IsResponsible
  userId    String
  familyId  String
  role      Role        @default(MEMBER)
  color     PersonColor
  createdAt DateTime    @default(now())
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  family    Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  @@id([userId, familyId])
  @@unique([familyId, color])
}

model Invitation {
  id          String    @id @default(uuid())
  familyId    String
  token       String    @unique          // crypto.randomUUID() ou 32 octets base64url
  createdById String
  expiresAt   DateTime                   // +7 jours
  usedById    String?
  usedAt      DateTime?
  createdAt   DateTime  @default(now())
  family      Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
}

model Event {
  id           String   @id @default(uuid())
  familyId     String
  createdById  String
  title        String
  startAt      DateTime                  // UTC
  endAt        DateTime?
  allDay       Boolean  @default(false)
  location     String?
  note         String?
  isCountdown  Boolean  @default(false)  // épinglé en « J-n » sur Aujourd'hui
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  family       Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  participants EventParticipant[]
  @@index([familyId, startAt])
}

model EventParticipant {                // couleur : 1 participant = sa couleur, tous = dégradé
  eventId String
  userId  String
  event   Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([eventId, userId])
}

enum WishCategory { MOVIE SERIES RESTAURANT OUTING TRIP GIFT OTHER }
enum WishStatus   { OPEN DONE }

model Wish {
  id          String       @id @default(uuid())
  familyId    String
  createdById String
  category    WishCategory
  title       String
  note        String?
  url         String?                    // lien Google Maps, site…
  imageUrl    String?                    // affiche TMDB, photo
  externalId  String?                    // ex. "tmdb:movie:693134"
  year        Int?
  forUserId   String?                    // GIFT : destinataire, qui ne voit PAS l'envie
  status      WishStatus   @default(OPEN)
  doneAt      DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  family      Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  votes       WishVote[]
  @@index([familyId, category, status])
}

enum Vote { YES NO }

model WishVote {
  wishId    String
  userId    String
  vote      Vote?                        // null = pas encore swipé
  rating    Int?                         // 1–5, après « fait »
  updatedAt DateTime @updatedAt
  wish      Wish @relation(fields: [wishId], references: [id], onDelete: Cascade)
  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([wishId, userId])
}

model Activity {                        // fil « Aujourd'hui »
  id        String   @id @default(uuid())
  familyId  String
  actorId   String
  type      String                       // "wish.added" | "wish.matched" | "wish.done" | "event.added" | "event.updated"
  payload   Json                         // { wishId, title, category } etc. (snapshot pour l'affichage)
  createdAt DateTime @default(now())
  family    Family @relation(fields: [familyId], references: [id], onDelete: Cascade)
  reactions ActivityReaction[]
  @@index([familyId, createdAt])
}

model ActivityReaction {
  activityId String
  userId     String
  emoji      String                      // "❤️" "😂" "🔥" "👍"
  createdAt  DateTime @default(now())
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  @@id([activityId, userId])             // une réaction par personne (remplaçable)
}
```

Ajouter côté `User` les relations inverses (`memberships`, `eventParticipations`, `wishVotes`).

**Règles métier :**
- **Match** = tous les membres du foyer ont voté `YES`. Le créateur d'une envie vote `YES` automatiquement. Une catégorie `GIFT` n'a ni vote ni match.
- Quand le vote qui crée le match arrive → `Activity("wish.matched")` + notification aux deux.
- **Visibilité des `GIFT`** : `forUserId` ne la voit jamais (filtre **côté serveur** dans toutes les requêtes et l'activité).
- **Couleur d'un événement** : déduite des `participants` (1 → sa couleur ; tous les membres → dégradé).
- Une `Activity` est écrite **dans la même transaction** que la mutation qui la produit (`prisma.$transaction`).

---

## 5. API (toutes sous `/api`, toutes `auth: true` sauf mention)

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/me` | user + ses foyers (`memberships` avec famille, rôle, couleur) |
| PATCH | `/me` | modifier le nom |
| POST | `/me/avatar` | upload avatar (**userId = session**, plus jamais le body) |
| POST | `/families` | créer un foyer `{ name, color }` → le créateur est ADMIN |
| GET | `/families/:id` | foyer + membres (id, nom, avatar, couleur, rôle) |
| PATCH | `/families/:id` | renommer (ADMIN) |
| PATCH | `/families/:id/me` | changer sa couleur |
| POST | `/families/:id/invitations` | génère un lien `{ url, expiresAt }` (invalide les précédentes) |
| GET | `/invitations/:token` | **public** : nom du foyer + qui invite (pour l'écran « Rejoindre ») |
| POST | `/invitations/:token/accept` | rejoindre ; couleur = la première libre |
| GET | `/families/:id/events?from=&to=` | événements de la plage (ISO) avec participants |
| POST / PATCH / DELETE | `/families/:id/events[/:eventId]` | CRUD |
| GET | `/families/:id/wishes?category=&status=` | envies + votes + `isMatch` + `myVote` |
| POST | `/families/:id/wishes` | créer (vote YES auto) |
| PATCH / DELETE | `/families/:id/wishes/:wishId` | modifier, marquer fait (`status: DONE`) |
| PUT | `/families/:id/wishes/:wishId/vote` | `{ vote: "YES" \| "NO" }` |
| PUT | `/families/:id/wishes/:wishId/rating` | `{ rating: 1..5 }` |
| GET | `/families/:id/wishes/to-swipe?category=` | envies sans vote de moi (pour le mode Match) |
| GET | `/families/:id/activity?limit=20` | fil, avec réactions |
| PUT | `/families/:id/activity/:activityId/reaction` | `{ emoji }` (DELETE pour retirer) |
| GET | `/search/movies?q=` | proxy TMDB films + séries (`language=fr-FR`), clé côté serveur |
| WS | `/ws` | temps réel (§2.4) |

**Supprimer** : `GET /api/users`, `GET /api/users/:id`, `GET /api/families` (liste globale).

---

## 6. PWA & déploiement

### 6.1 Configuration PWA

Dépendances : `vite-plugin-pwa`, `workbox-precaching`, `workbox-routing`, `workbox-strategies` ; `@vite-pwa/assets-generator` (dev) pour les icônes.

```ts
// vite.config.ts
VitePWA({
  strategies: "injectManifest",   // SW custom dès le départ (push plus tard)
  srcDir: "src", filename: "sw.ts",
  registerType: "autoUpdate",
  manifest: {
    name: "Noo", short_name: "Noo", lang: "fr",
    start_url: "/", scope: "/", display: "standalone", orientation: "portrait",
    theme_color: "<token fond>", background_color: "<token fond>",
    icons: [ /* 192, 512, 512 maskable — générés depuis le symbole du logo */ ],
  },
})
```

`index.html` :
- `lang="fr"`
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` = `black-translucent`, `apple-mobile-web-app-title` = `Noo`
- `<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`, `theme-color`
- Remplacer le favicon `vite.svg` par le logo.

`sw.ts` : `precacheAndRoute(self.__WB_MANIFEST)`, fallback de navigation vers `index.html` (SPA), `NetworkFirst` sur les `GET /api/*` (timeout 3 s). Plus tard : les handlers `push` et `notificationclick`.

**Hors-ligne (lecture)** : `@tanstack/query-persist-client` + persister `localStorage` → l'app s'ouvre instantanément avec les dernières données, même en métro. Pas de mutations hors-ligne dans le MVP.

**Installation** :
- Android/Chrome : capter `beforeinstallprompt` → bouton « Installer Noo ».
- iOS Safari (pas en mode standalone) : écran guide illustré « Partager ⬆️ → Sur l'écran d'accueil ».
- Détection : `matchMedia("(display-mode: standalone)")` ou `navigator.standalone`.

**⚠️ Google OAuth sur iOS** : en PWA installée, la redirection OAuth peut s'ouvrir dans Safari, dont les cookies sont séparés de ceux de la PWA, et on se retrouve non connecté dans l'app. **L'email + mot de passe est la méthode principale dans la PWA** ; Google reste dispo mais doit être testé sur l'iPhone, et masqué en standalone iOS si ça casse.

### 6.2 Tester sur téléphone pendant le dev

- UI seulement : `bun run dev` + Vite `host: true` → `http://<ip-du-pc>:5173` sur le même wifi (pas de service worker, car il faut HTTPS).
- PWA complète : `cloudflared tunnel --url http://localhost:5173` → URL HTTPS temporaire (ajouter l'origine aux `trustedOrigins` via l'env).
- Le mieux : **déployer tôt** (fin de Phase 2), puis chaque push met à jour l'app sur vos deux téléphones.

### 6.3 Hébergement (recommandation, tout en offre gratuite ou quasi)

| Quoi | Où |
|---|---|
| App (Elysia + front buildé) | **Railway** (ou Fly.io), un seul service, Dockerfile Bun |
| PostgreSQL | **Neon** (`DATABASE_URL` poolée + `DIRECT_URL` directe) |
| Images | Cloudinary (déjà en place) |

Build : `cd frontend && bun run build` → `backend` sert `../frontend/dist` via `@elysiajs/static`, avec fallback `index.html` pour toutes les routes non-`/api`.

### 6.4 Variables d'environnement

```
# backend/.env (et .env.example commité)
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000     # prod : https://noo.xxx
APP_ORIGIN=http://localhost:5173          # prod : même URL ; sert aux trustedOrigins
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
TMDB_API_KEY=
VAPID_PUBLIC_KEY=                         # phase notifications
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:...
```

Dev local : `docker-compose.yml` à la racine avec un service `postgres:17` (port 5432, volume nommé).

---

## 7. Écrans (spécification)

### Navigation

```
/signin  /signup  /join/:token  /onboarding   (hors shell)
/                → Aujourd'hui   ┐
/agenda          → Agenda        │ dans AppShell
/envies          → Envies        │ (TabBar en bas)
/envies/:cat     → liste         │
/envies/match    → mode Match    │
/ce-soir         → tirage        │
/moi             → profil/réglages (via avatar en haut à droite)
```

TabBar fixe en bas : `Aujourd'hui · Agenda · [ + ] · Envies`. Le **+** central est rond, en dégradé, légèrement surélevé, et ouvre le Quick Add.

### Flux d'arrivée
1. Inscription (mobile, plein écran, garder l'ambiance « Crépuscule » de la page de connexion actuelle).
2. Pas de foyer → `/onboarding` : « Créez votre foyer » (nom, pré-rempli « Chez nous ») + choix de couleur violet/orange.
3. Lien d'invitation → partage via `navigator.share()` (WhatsApp, SMS…), avec un bouton copier en fallback.
4. L'autre ouvre `/join/:token` → « Antoine t'invite à rejoindre *Chez nous* » → inscription/connexion → accept → redirection vers `/`.
5. Si non installé : proposer l'installation (§6.1).

### 🏠 Aujourd'hui (`/`)
De haut en bas :
1. **Salutation** : « Bonjour / Bon après-midi / Bonsoir {prénom} » + date (« mardi 20 octobre »). Avatar → `/moi`.
2. **Comptes à rebours** : carrousel horizontal des `Event.isCountdown` à venir (« J-12 · Lisbonne »), en dégradé si commun.
3. **Aujourd'hui / Demain** : événements, avec un point de couleur par personne. Vide → « Rien de prévu ».
4. **Carte suggestion** : si ce soir personne n'a d'événement après 19h et qu'il existe des matchs → « Vous êtes libres ce soir 🌙 — *Ce soir on fait quoi ?* » → `/ce-soir`.
5. **Swipes en attente** : « 3 nouvelles envies de {elle} à swiper » → `/envies/match`.
6. **Fil de l'autre** (48 h, 5 max) : « {elle} a ajouté *Dune 2* aux films », avec réaction emoji d'un tap (❤️ par défaut, appui long pour choisir).

### 📅 Agenda (`/agenda`)
- **Vue semaine par défaut** : bandeau de 7 jours scrollable horizontalement (swipe = semaine suivante), liste des événements du jour sélectionné dessous. Bouton « Aujourd'hui ». Vue mois en option (simple grille de points colorés).
- Création/édition en bottom sheet : titre, jour, heure (ou « toute la journée »), **« Pour qui ? » = Moi / {elle} / Nous deux** (gros boutons colorés, défaut : Nous deux), lieu, note, « Épingler en compte à rebours ».
- **« On est libres quand ? »** : bouton qui liste les soirées (19h–23h) et demi-journées de week-end sans aucun événement sur les 14 prochains jours (calcul côté client sur les events chargés). Tap → crée un événement « Nous deux » pré-rempli.
- Récurrence : **hors MVP** (v1.1).

### ✨ Envies (`/envies`)
- Grille de catégories avec compteur et nombre de matchs : 🎬 Films · 📺 Séries · 🍽️ Restos · 🎟️ Sorties · ✈️ Voyages · 🎁 Cadeaux · 💡 Autre.
- Deux gros boutons en haut : **« Matcher »** (badge : nombre à swiper) et **« Ce soir on fait quoi ? »**.
- Liste d'une catégorie : onglets *Matchs* (en dégradé) / *Toutes* / *Faites*. Carte = image, titre, avatars de qui a dit oui.
- Ajout Film/Série : recherche TMDB en direct (debounce 300 ms) → affiche + année auto. Resto/Sortie : titre + lien (coller un lien Google Maps) + note.
- Fiche : voter, marquer « On l'a fait ✅ » → chacun note ⭐ → la fiche passe dans *Faites* (votre historique).
- 🎁 Cadeaux : le choix du destinataire est obligatoire et la fiche est invisible pour lui (filtre serveur). Pas de vote.

### 💞 Mode Match (`/envies/match`)
- Pile de cartes plein écran (une catégorie ou toutes) : swipe droite = oui, gauche = non, avec des boutons en fallback. Animation au pouce (pointer events + transform ; `motion` si besoin).
- Quand un swipe crée un match : **animation plein écran « C'est un match ! »** en dégradé, petite vibration, puis notification à l'autre.
- Fin de pile : « Tout est swipé 🎉 — ajoute de nouvelles envies ».

### 🎲 Ce soir on fait quoi ? (`/ce-soir`)
- Choix rapide : Film · Série · Resto · Sortie · Surprise (toutes catégories).
- Tirage au hasard parmi les **matchs OPEN**, avec une animation façon machine à sous (3–4 cartes qui défilent puis ralentissent).
- Actions : **« Un autre »** · **« On fait ça ! »** → crée un événement « Nous deux » ce soir à 20h30 + `Activity`.
- Zéro match → message + bouton vers le mode Match.

### ➕ Quick Add (bottom sheet du +)
- Un champ texte autofocus + des puces de type : 📅 Événement · 🎬 Film · 📺 Série · 🍽️ Resto · 🎟️ Sortie · ✈️ Voyage · 🎁 Cadeau.
- Puce par défaut = la dernière utilisée. Entrée = ajouté (pour Film/Série : choix dans les résultats TMDB). Les détails se règlent ensuite sur la fiche.
- **Bonus v1.1** : saisie en langage naturel (« resto avec Paul vendredi 20h ») analysée par l'API Claude côté backend.

### 👤 Moi (`/moi`)
Avatar (upload existant), nom, couleur, membres du foyer + lien d'invitation, notifications (phase 7), déconnexion. Garder l'existant mais en une seule colonne mobile.

---

## 8. Phases d'exécution

> Une branche par phase (`feat/…`), commits atomiques, `bun run build` (front) et `bun x tsc --noEmit` (back) verts avant chaque commit. Chaque phase se termine par une démo sur téléphone.

### Phase 1 — Assainir (≈ 1–2 soirées) · `feat/cleanup`
1. Installer Bun ; `docker-compose.yml` Postgres ; `backend/.env.example` ; `.env` local.
2. `.gitignore` : retirer la ligne `prisma/migrations/**/migration.sql`.
3. `lib/prisma.ts` = client unique ; l'utiliser dans `lib/auth.ts`, `seed.ts`, `seed/*.ts`.
4. `lib/env.ts` ; CORS et `trustedOrigins` depuis `APP_ORIGIN` ; front en URLs relatives + proxy Vite.
5. `plugins/auth-guard.ts` + `plugins/family-guard.ts`.
6. Supprimer les routes publiques `users`/`families` ; créer `GET /me` ; avatar → `POST /me/avatar` basé sur la session.
7. Schéma : `Membership` (rôle + couleur) à la place de `IsMember`/`IsResponsible` ; `migrate reset` ; nouveau seed = 2 comptes de dev (`toi@noo.dev` / `elle@noo.dev`, mot de passe `password123`) + un foyer.
8. Front : `api.ts`, `QueryClientProvider`, réécrire profil et dashboard famille avec TanStack Query ; tout derrière `ProtectedRoute`.
9. Supprimer `my-app/` (**après OK**), `App.css`, `lib/auth.ts` vide côté front.
- ✅ *Fini quand* : impossible de lire des données sans session ou hors de son foyer (tests Vitest), l'app tourne avec `docker compose up` + `bun dev` des deux côtés.

### Phase 2 — Coquille PWA + design + déploiement (≈ 1 semaine) · `feat/pwa-shell`
1. Tokens de design (§3.2) appliqués au thème shadcn + polices. *(Attendre le site d'inspiration ; sinon partir des valeurs provisoires.)*
2. `vite-plugin-pwa`, manifest, icônes, `sw.ts`, metas iOS, CSS mobile (§3.3).
3. `AppShell` + `TabBar` + FAB + routes vides (Aujourd'hui / Agenda / Envies / Moi) avec états vides.
4. Pages auth en version mobile.
5. Elysia sert `frontend/dist` ; Dockerfile ; déploiement Railway + Neon ; mettre à jour les redirections Google OAuth.
6. Écran / bouton d'installation (§6.1).
- ✅ *Fini quand* : Noo est installée sur **les deux téléphones**, s'ouvre en plein écran avec la bonne icône, et la connexion tient après fermeture de l'app.

### Phase 3 — Foyer & invitation (≈ 3–4 soirées) · `feat/household`
1. Routes foyer/invitations (§5) + tests (lien expiré, déjà utilisé, déjà membre, foyer plein en couleurs).
2. `/onboarding`, partage du lien, `/join/:token` (avec retour après inscription), store `activeFamilyId`.
3. `lib/person-color.ts` + composants `PersonDot` / `PersonBadge` / avatar cerclé.
- ✅ *Fini quand* : ta copine a rejoint le foyer depuis son téléphone via un lien WhatsApp.

### Phase 4 — Agenda (≈ 1 semaine) · `feat/agenda`
1. Modèles `Event` / `EventParticipant` + routes + tests de permissions.
2. Vue semaine, sheet de création/édition, « Pour qui ? », compte à rebours.
3. « On est libres quand ? ».
4. Écriture des `Activity` pour les événements.
- ✅ *Fini quand* : vous planifiez votre semaine dedans pendant 7 jours.

### Phase 5 — Envies, Match, Ce soir (≈ 1–1,5 semaine) · `feat/wishes`
1. Modèles `Wish` / `WishVote` + routes + tests (match, visibilité des cadeaux).
2. Proxy TMDB + recherche dans le formulaire.
3. Écran catégories, listes, fiche, « fait » + notes.
4. Mode Match (swipe + animation de match).
5. « Ce soir on fait quoi ? ».
6. Quick Add (bottom sheet du +).

### Phase 6 — Aujourd'hui + temps réel (≈ 1 semaine) · `feat/today-realtime`
1. Écran Aujourd'hui complet (§7), alimenté par events + wishes + activity.
2. Réactions emoji sur l'activité.
3. WebSocket `/ws` + `lib/realtime.ts` ; `publish` après chaque mutation.
4. Persistance du cache TanStack Query (ouverture instantanée / hors-ligne en lecture).
- ✅ *Fini quand* : une envie ajoutée sur un téléphone apparaît sur l'autre en < 1 s.

### Phase 7 — Notifications push (≈ 4–5 soirées) · `feat/push`
1. `web-push` côté backend, clés VAPID, modèle `PushSubscription { id, userId, endpoint @unique, p256dh, auth, createdAt }`.
2. Opt-in dans `/moi` et après un premier match (jamais au premier lancement). Sur iOS, uniquement en PWA installée (iOS ≥ 16.4).
3. `sw.ts` : `push` → `showNotification`, `notificationclick` → ouvrir la bonne page.
4. Déclencheurs : l'autre ajoute une envie ou un événement « Nous deux », **match**, rappel 1 h avant un événement (`setInterval` côté backend toutes les minutes, avec un champ `reminderSentAt` sur `Event`).
5. Regrouper et limiter (pas plus d'une notification par type toutes les 10 min).

### Après le MVP (idées validées ou proposées)
- Thème « du lever au coucher » (direction C) si elle n'a pas été retenue dès la Phase 2.
- Saisie en langage naturel dans le Quick Add (API Claude).
- Récurrence des événements.
- Récap de la semaine, « il y a un an… » (souvenirs depuis les envies *Faites*).
- Question du jour / « je pense à toi » en un tap.
- Liste de courses partagée, dépenses partagées (façon Tricount).
- Ouverture à la famille (plus de 2 couleurs, rôles).

---

## 9. Checklist de test manuel (à chaque phase)

- [ ] iPhone (Safari + PWA installée) et Android (Chrome + PWA installée)
- [ ] Rien n'est masqué par l'encoche ou la barre home ; le clavier ne cache pas le champ actif
- [ ] Pas de zoom à la saisie ; pas de scroll horizontal
- [ ] Chaque action donne un retour en < 100 ms (optimistic)
- [ ] L'app se relance connectée après avoir été tuée
- [ ] Mode avion : l'app s'ouvre et affiche les dernières données
- [ ] Les deux comptes voient les bonnes couleurs (moi violet / elle orange / nous dégradé)
