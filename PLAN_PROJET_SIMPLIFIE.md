# 📋 Plan de Projet - Noo (Architecture Simplifiée)

## 🎯 Vue d'ensemble

**Objectif** : Application collaborative pour centraliser les besoins d'une famille (calendrier, messages, factures, listes de courses)

**Public** : Familles cherchant une solution centralisée et sécurisée

**Type** : Projet d'apprentissage avec rendu professionnel

**Architecture** : **Monolithe modulaire** (simple, évolutif vers microservices si besoin)

---

## 🏗️ Architecture Technique

### Stack Technologique

#### Frontend

- **Framework** : React 18+ avec TypeScript
- **Build Tool** : Vite
- **Styling** : TailwindCSS + Shadcn/ui (composants)
- **State Management** :
  - Zustand (état global léger)
  - TanStack Query (gestion données serveur, cache)
- **Routing** : React Router v6
- **Forms** : React Hook Form + Zod (validation)
- **Dates** : date-fns
- **Icons** : Lucide React

#### Backend (Monolithe Modulaire)

- **Runtime** : Bun (rapide, TypeScript natif)
- **Framework** : ElysiaJS (moderne, type-safe)
- **Base de données** : PostgreSQL (unique, bien structurée)
- **ORM** : Prisma (excellente DX, migrations simples)
- **Authentication** : Better-Auth
- **Validation** : Zod
- **Email** : Resend ou Nodemailer
- **Cache** : Redis (optionnel pour plus tard)

#### Infrastructure

- **Déploiement Frontend** : Vercel (gratuit, CI/CD automatique)
- **Déploiement Backend** : Railway ou Fly.io (gratuit pour commencer)
- **Base de données** : Railway PostgreSQL ou Supabase
- **Stockage fichiers** : Cloudinary (images/documents gratuit)
- **Monitoring** : Sentry (erreurs), Vercel Analytics

#### Mobile

- **PWA** (Progressive Web App) : Installation sur mobile, notifications, mode hors-ligne

---

## 📊 Architecture Monolithique Modulaire

```
┌─────────────────────────────────────────────────────────────┐
│                          CLIENTS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile PWA  │  │    Tablet    │     │
│  │   (React)    │  │   (React)    │  │   (React)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                     ┌───────▼────────┐
                     │   API Backend  │
                     │   (ElysiaJS)   │
                     └───────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼─────┐      ┌──────▼──────┐     ┌────▼─────┐
    │  Auth   │      │   Business   │     │  Email   │
    │ Module  │      │    Modules   │     │  Worker  │
    │         │      │              │     │ (Async)  │
    └────┬────┘      └──────┬───────┘     └──────────┘
         │                  │
         │    ┌─────────────┼──────────────┐
         │    │             │              │
         │  ┌─▼─────┐  ┌────▼────┐  ┌─────▼──────┐
         │  │Users │  │Families │  │ Calendar   │
         │  └──────┘  └─────────┘  └────────────┘
         │
         │  ┌────────┐  ┌─────────┐  ┌──────────┐
         │  │Messages│  │Shopping │  │Documents │
         │  └────────┘  └─────────┘  └──────────┘
         │
         └──────────────────┬──────────────────┘
                            │
                   ┌────────▼─────────┐
                   │   PostgreSQL     │
                   │  (Base Unique)   │
                   │                  │
                   │ - users          │
                   │ - families       │
                   │ - events         │
                   │ - messages       │
                   │ - shopping       │
                   │ - documents      │
                   └──────────────────┘
```

### Avantages Architecture Monolithique

✅ **Simplicité** : Un seul projet backend, une seule DB
✅ **Développement rapide** : Pas de communication inter-services
✅ **Debugging facile** : Tout dans un seul processus
✅ **Transactions** : ACID natif avec Prisma
✅ **Déploiement** : Un seul service à gérer
✅ **Modulaire** : Code bien organisé par domaines
✅ **Évolution** : Possibilité d'extraire des microservices plus tard

---

## 📁 Structure du Projet

```
noo/
├── frontend/                    # Application React
│   ├── src/
│   │   ├── app/                # Configuration app (Router, Providers)
│   │   ├── features/           # Modules par fonctionnalité
│   │   │   ├── auth/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── api/
│   │   │   │   └── types/
│   │   │   ├── families/
│   │   │   ├── calendar/
│   │   │   ├── messages/
│   │   │   ├── shopping/
│   │   │   └── documents/
│   │   ├── components/         # Composants réutilisables
│   │   │   ├── ui/            # Shadcn components
│   │   │   └── common/        # Composants custom
│   │   ├── lib/               # Utilitaires, helpers
│   │   ├── hooks/             # Hooks globaux
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # Types TypeScript globaux
│   │   └── styles/            # Styles globaux
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/                     # API ElysiaJS (Monolithe)
│   ├── src/
│   │   ├── index.ts            # Point d'entrée
│   │   ├── modules/            # Modules métier
│   │   │   ├── auth/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   ├── users/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   ├── families/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   ├── events/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   ├── messages/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   └── types.ts
│   │   │   ├── shopping/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   └── types.ts
│   │   │   └── documents/
│   │   │       ├── routes.ts
│   │   │       ├── service.ts
│   │   │       └── types.ts
│   │   ├── lib/                # Services partagés
│   │   │   ├── db.ts          # Prisma client
│   │   │   ├── auth.ts        # Better-Auth config
│   │   │   ├── email.ts       # Service email
│   │   │   └── upload.ts      # Cloudinary
│   │   ├── middlewares/        # Middlewares globaux
│   │   │   ├── auth.ts
│   │   │   ├── cors.ts
│   │   │   ├── error.ts
│   │   │   └── validation.ts
│   │   ├── types/              # Types partagés
│   │   ├── utils/              # Utilitaires
│   │   └── config/             # Configuration
│   │       └── env.ts
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma unique
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                        # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── package.json                # Scripts racine (optionnel)
```

---

## 🗄️ Modèle de Données (PostgreSQL Unique)

### Schéma Prisma Complet

```prisma
// ============================================
// USERS & AUTHENTICATION
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  familyMembers FamilyMember[]
  messages      Message[]
  createdItems  ShoppingListItem[]
  uploadedDocs  Document[]
}

// ============================================
// FAMILIES
// ============================================

model Family {
  id          String    @id @default(uuid())
  name        String
  description String?
  avatar      String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  members       FamilyMember[]
  invitations   Invitation[]
  events        Event[]
  messages      Message[]
  shoppingLists ShoppingList[]
  documents     Document[]
}

model FamilyMember {
  id        String    @id @default(uuid())
  role      String    @default("member") // admin, member
  joinedAt  DateTime  @default(now())

  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  familyId  String
  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)

  @@unique([userId, familyId])
}

model Invitation {
  id        String    @id @default(uuid())
  email     String
  code      String    @unique
  status    String    @default("pending") // pending, accepted, expired
  expiresAt DateTime
  createdAt DateTime  @default(now())

  familyId  String
  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  invitedBy String
}

// ============================================
// CALENDAR
// ============================================

model Event {
  id          String    @id @default(uuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime?
  allDay      Boolean   @default(false)
  color       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  familyId    String
  family      Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  createdById String

  @@index([familyId, startDate])
}

// ============================================
// MESSAGES
// ============================================

model Message {
  id        String    @id @default(uuid())
  content   String
  type      String    @default("text") // text, image, file
  createdAt DateTime  @default(now())

  familyId  String
  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  authorId  String
  author    User      @relation(fields: [authorId], references: [id])

  @@index([familyId, createdAt])
}

// ============================================
// SHOPPING LISTS
// ============================================

model ShoppingList {
  id        String    @id @default(uuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  familyId  String
  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  items     ShoppingListItem[]
}

model ShoppingListItem {
  id          String    @id @default(uuid())
  name        String
  quantity    Int       @default(1)
  checked     Boolean   @default(false)
  createdAt   DateTime  @default(now())

  listId      String
  list        ShoppingList @relation(fields: [listId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
}

// ============================================
// DOCUMENTS
// ============================================

model Document {
  id          String    @id @default(uuid())
  name        String
  type        String    // invoice, contract, photo, other
  url         String
  size        Int
  uploadedAt  DateTime  @default(now())

  familyId    String
  family      Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy  User      @relation(fields: [uploadedById], references: [id])

  @@index([familyId, type])
}
```

---

## 🎓 Plan d'Apprentissage (Phases)

### ⚙️ Phase 0 : Setup & Configuration (2-3 jours)

**Objectif** : Environnement de développement professionnel

#### Actions

1. **Initialiser le projet**

   ```bash
   cd C:\Users\antoi\noo
   git init
   ```

2. **Setup Frontend** ✅ (Déjà fait)

   ```bash
   # Installer les dépendances essentielles
   cd frontend
   npm install react-router-dom @tanstack/react-query zustand axios
   npm install react-hook-form zod @hookform/resolvers
   npm install date-fns lucide-react

   # TailwindCSS v4 (avec plugin Vite)
   npm install -D tailwindcss @tailwindcss/vite

   # Shadcn/ui (après TailwindCSS)
   npx shadcn@latest init
   ```

3. **Setup Backend**

   ```bash
   cd ../backend
   bun init -y
   bun add elysia
   bun add @prisma/client
   bun add -d prisma
   bun add @elysiajs/cors
   bun add zod
   bun add better-auth
   ```

4. **Configuration Prisma**

   ```bash
   cd backend
   bunx prisma init
   # Copier le schéma Prisma ci-dessus dans prisma/schema.prisma
   ```

5. **Configuration outils**
   - ESLint + Prettier (formatage cohérent)
   - Git hooks avec Husky (optionnel)
   - Environment variables (.env)

**Apprentissages** :

- Structure projet moderne
- Configuration TypeScript
- Outils de développement professionnels

---

### 🔐 Phase 1 : Authentication & Users (1 semaine)

**Objectif** : Système d'authentification complet et sécurisé

#### Backend

1. **Prisma Setup**

   ```bash
   # Créer la base de données
   bunx prisma migrate dev --name init
   ```

2. **Better-Auth Configuration**
   - Installation et setup
   - Routes : register, login, logout, refresh token
   - Middleware de protection des routes

3. **API Users**
   - GET /api/users/me (profil utilisateur)
   - PATCH /api/users/me (mise à jour profil)
   - Upload avatar (Cloudinary)

#### Frontend

1. **Pages d'authentification**
   - Login page (React Hook Form + Zod)
   - Register page
   - Design professionnel avec Shadcn/ui

2. **Auth Context/Store**
   - Zustand store pour l'état auth
   - Hooks : useAuth, useUser
   - Protected routes

3. **Profil utilisateur**
   - Page de profil
   - Édition informations
   - Upload avatar

**Apprentissages** :

- JWT et sessions
- Validation de données (Zod)
- Gestion de l'état global (Zustand)
- Formulaires React professionnels
- Upload de fichiers

**Tests** :

- Créer 3 comptes utilisateurs
- Tester login/logout
- Vérifier persistance session

---

### 👨‍👩‍👧‍👦 Phase 2 : Familles & Membres (1 semaine)

**Objectif** : Gestion des familles et invitations

#### Backend

1. **API Families**
   - POST /api/families (créer famille)
   - GET /api/families (liste familles user)
   - GET /api/families/:id (détails)
   - PATCH /api/families/:id (modifier)
   - DELETE /api/families/:id (supprimer)

2. **API Members**
   - POST /api/families/:id/invite (générer invitation)
   - POST /api/families/join (rejoindre via code/email)
   - DELETE /api/families/:id/members/:userId (retirer membre)
   - PATCH /api/families/:id/members/:userId/role (changer rôle)

3. **Service Email**
   - Template email d'invitation
   - Envoi avec Resend

#### Frontend

1. **Dashboard**
   - Liste des familles
   - Sélection famille active
   - Switch entre familles

2. **Gestion Famille**
   - Modal création famille
   - Page paramètres famille
   - Liste des membres avec rôles
   - Formulaire d'invitation (email + lien)

3. **Rejoindre Famille**
   - Page avec code invitation
   - Validation et ajout automatique

**Apprentissages** :

- Relations complexes avec Prisma
- Gestion des permissions (admin/member)
- Envoi d'emails
- Génération de tokens/codes
- Navigation multi-entités

**Tests** :

- Créer 2 familles par utilisateur
- Inviter d'autres utilisateurs
- Tester rôles et permissions

---

### 📅 Phase 3 : Calendrier Partagé (1 semaine)

**Objectif** : Calendrier collaboratif par famille

#### Backend

1. **API Events**
   - CRUD complet
   - GET /api/families/:id/events?start=&end= (filtrage par dates)

#### Frontend

1. **Composant Calendrier**
   - Vue mensuelle (grille)
   - Navigation mois précédent/suivant

2. **Gestion Events**
   - Modal création/édition événement
   - Date picker
   - Color picker
   - Affichage détails événement

3. **Synchronisation**
   - TanStack Query pour cache et refresh auto
   - Optimistic updates

**Apprentissages** :

- Manipulation de dates (date-fns)
- Composants complexes (calendrier)
- Cache et synchronisation (React Query)
- Optimistic UI updates

---

### 💬 Phase 4 : Messages & Feed (1 semaine)

**Objectif** : Fil d'actualité familial

#### Backend

1. **API Messages**
   - POST /api/families/:id/messages
   - GET /api/families/:id/messages (pagination)
   - DELETE /api/messages/:id
   - Support upload images

2. **WebSocket (optionnel v2)**
   - ElysiaJS WebSocket pour temps réel

#### Frontend

1. **Feed Messages**
   - Liste messages avec infinite scroll
   - Affichage auteur + timestamp
   - Support images/fichiers

2. **Création Message**
   - Input avec envoi (Enter)
   - Upload d'images
   - Preview avant envoi

**Apprentissages** :

- Pagination et infinite scroll
- WebSocket (temps réel) - optionnel
- Upload et preview fichiers
- Optimistic updates

---

### 🛒 Phase 5 : Liste de Courses (4-5 jours)

**Objectif** : Listes collaboratives avec items cochables

#### Backend

1. **API Shopping**
   - CRUD listes et items
   - PATCH pour cocher/décocher items

#### Frontend

1. **Vue Listes**
   - Liste des listes de courses
   - Création nouvelle liste

2. **Détail Liste**
   - Items avec checkbox
   - Ajout rapide d'items
   - Suppression items

**Apprentissages** :

- Relations imbriquées (liste → items)
- Interactions rapides (checkbox, ajout)

---

### 📄 Phase 6 : Documents & Factures (4-5 jours)

**Objectif** : Stockage et organisation de documents

#### Backend

1. **API Documents**
   - Upload vers Cloudinary
   - GET /api/families/:id/documents (filtrage par type)
   - DELETE /api/documents/:id

#### Frontend

1. **Bibliothèque Documents**
   - Grille/liste de documents
   - Filtres par type (facture, contrat, photo)
   - Preview documents

2. **Upload**
   - Drag & drop zone
   - Progress bar
   - Validation taille/type fichier

**Apprentissages** :

- Storage cloud (Cloudinary)
- Upload avancé (drag & drop, progress)
- Preview fichiers (PDF, images)

---

### 🎨 Phase 7 : UX/UI & PWA (1 semaine)

**Objectif** : Expérience utilisateur professionnelle

#### Actions

1. **Design System**
   - Harmoniser couleurs, espacements
   - Composants réutilisables cohérents
   - Dark mode (optionnel)

2. **PWA Configuration**
   - Manifest.json
   - Service Worker
   - Installation sur mobile
   - Mode hors-ligne basique

3. **Responsive Design**
   - Mobile-first
   - Tester sur différents devices
   - Navigation mobile (bottom nav)

4. **Animations & Feedback**
   - Loading states
   - Toast notifications
   - Transitions fluides

**Apprentissages** :

- PWA et service workers
- Design responsive avancé
- Micro-interactions UX

---

### 🚀 Phase 8 : Déploiement & Finitions (4-5 jours)

**Objectif** : Application en production

#### Déploiement

1. **Frontend sur Vercel**
   - Connexion repo GitHub
   - Variables d'environnement
   - Déploiement automatique

2. **Backend sur Railway/Fly.io**
   - Configuration
   - Database PostgreSQL
   - Variables d'environnement

3. **Configuration Domaine** (optionnel)
   - Domaine custom
   - HTTPS automatique

#### Finitions

1. **Tests utilisateurs**
   - Inviter vraie famille à tester
   - Recueillir feedback

2. **Optimisations**
   - Performance (Lighthouse)
   - SEO basique
   - Error handling complet

3. **Documentation**
   - README avec captures d'écran
   - Guide d'utilisation
   - Documentation API

---

## 📚 Ressources d'Apprentissage

### Documentation Officielle

- **React** : https://react.dev
- **TypeScript** : https://www.typescriptlang.org/docs/
- **ElysiaJS** : https://elysiajs.com
- **Prisma** : https://www.prisma.io/docs
- **Better-Auth** : https://www.better-auth.com/docs
- **TailwindCSS** : https://tailwindcss.com/docs
- **Shadcn/ui** : https://ui.shadcn.com

---

## ✅ Checklist Qualité (À chaque phase)

### Code

- [ ] TypeScript strict activé, pas de `any`
- [ ] ESLint sans erreurs
- [ ] Code formaté (Prettier)
- [ ] Noms de variables explicites
- [ ] Fonctions < 50 lignes
- [ ] Composants single responsibility

### Git

- [ ] Commits atomiques et descriptifs
- [ ] Branches par feature (`feat/calendar`, `feat/auth`)

### Tests Manuels

- [ ] Tester happy path
- [ ] Tester cas d'erreur
- [ ] Tester sur mobile
- [ ] Tester avec données réelles

---

## 🎯 Critères de Succès

### MVP (Version 1.0)

- [ ] Création compte et connexion fonctionnels
- [ ] Création et gestion de plusieurs familles
- [ ] Minimum 2 features partagées opérationnelles (ex: calendrier + messages)
- [ ] Design responsive et professionnel
- [ ] Application déployée et accessible en ligne
- [ ] Pas de bugs bloquants

### Apprentissage

- [ ] Compréhension solide de React + TypeScript
- [ ] Maîtrise de Prisma et PostgreSQL
- [ ] Backend API REST bien architecturé
- [ ] Capacité à déployer une app full-stack
- [ ] Portfolio avec projet présentable

---

## 📅 Estimation Temps Total

**Total estimé : 7-9 semaines** (à temps partiel, ~15h/semaine)

- Phase 0 : 2-3 jours
- Phase 1 : 7 jours
- Phase 2 : 7 jours
- Phase 3 : 7 jours
- Phase 4 : 7 jours
- Phase 5 : 5 jours
- Phase 6 : 5 jours
- Phase 7 : 7 jours
- Phase 8 : 5 jours

---

## 🔄 Évolutions Futures (v2+)

### Fonctionnalités Avancées

- 📊 Dashboard Analytics
- 💰 Gestion Budget partagé
- 🎂 Rappels Automatiques
- 🗳️ Système de Votes
- 🤖 Notifications Push
- 🌐 i18n (multi-langues)
- 🌙 Dark Mode

### Améliorations Techniques

- Tests automatisés (Vitest, Playwright)
- CI/CD avancé
- Monitoring (Sentry)
- Rate limiting
- **Migration vers Microservices** (si nécessaire pour scalabilité)

---

## 💡 Conseils

### Pendant le Développement

1. **Lire la documentation** plutôt que copier-coller
2. **Comprendre le "pourquoi"** de chaque choix technique
3. **Expérimenter** : tester différentes approches
4. **Commenter** le code complexe
5. **Debugger** méthodiquement

### Bonnes Pratiques

1. **Git commits réguliers**
2. **README à jour**
3. **Refactoring continu**
4. **Code reviews** : relire son code
5. **Journal de bord** : noter blocages et solutions

---

## 📞 Prochaines Étapes

1. ✅ **Frontend initialisé** (Vite + React)
2. **Installer dépendances frontend** (voir Phase 0)
3. **Setup Backend** (Bun + ElysiaJS)
4. **Initialiser Prisma**
5. **Commencer Phase 1** (Auth)

**Prêt à commencer ?** 🚀
