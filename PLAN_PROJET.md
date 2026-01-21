# 📋 Plan de Projet - Noo (Application Familiale)

## 🎯 Vue d'ensemble

**Objectif** : Application collaborative pour centraliser les besoins d'une famille (calendrier, messages, factures, listes de courses)

**Public** : Familles cherchant une solution centralisée et sécurisée

**Type** : Projet d'apprentissage avec rendu professionnel

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
- **Dates** : date-fns ou Day.js
- **Icons** : Lucide React

#### Backend (Monolithe Modulaire)

- **Runtime** : Bun (rapide, TypeScript natif)
- **Framework** : ElysiaJS (moderne, type-safe)
- **Base de données** : PostgreSQL (unique pour commencer)
- **ORM** : Prisma (excellente DX, migrations simples)
- **Authentication** : Better-Auth
- **Validation** : Zod
- **Email** : Resend ou Nodemailer
- **Architecture** : Modules séparés (migration microservices facilitée)

#### Infrastructure

- **Déploiement Frontend** : Vercel (gratuit, CI/CD automatique)
- **Déploiement Backend** : Railway ou Fly.io (gratuit pour commencer)
- **Base de données** : Railway PostgreSQL ou Supabase
- **Stockage fichiers** : Cloudinary (images/documents gratuit)
- **Monitoring** : Sentry (erreurs), Vercel Analytics

#### Mobile

- **PWA** (Progressive Web App) : Installation sur mobile, notifications, mode hors-ligne

---

## 📊 Architecture Système (Monolithe Modulaire)

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Web App    │  │  Mobile PWA  │  │    Tablet    │           │
│  │   (React)    │  │   (React)    │  │   (React)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   API GATEWAY    │
                    │   (ElysiaJS)     │
                    │  - Routing       │
                    │  - Auth Check    │
                    │  - Rate Limiting │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐         ┌───▼────┐          ┌────▼─────┐
   │   Auth   │         │ Users  │          │ Families │
   │ Service  │────────▶│Service │◀─────────│ Service  │
   │  :3001   │         │ :3002  │          │  :3003   │
   └────┬─────┘         └───┬────┘          └────┬─────┘
        │                   │                     │
   ┌────▼─────┐        ┌───▼────┐           ┌────▼─────┐
   │  DB-Auth │        │DB-Users│           │DB-Families│
   └──────────┘        └────────┘           └──────────┘

        ┌─────────────────┬─────────────────┬──────────────────┐
        │                 │                 │                  │
   ┌────▼─────┐      ┌────▼────┐      ┌────▼─────┐      ┌────▼──────┐
   │Calendar  │      │Messages │      │Shopping  │      │Documents  │
   │Service   │      │Service  │      │Service   │      │Service    │
   │  :3004   │      │ :3005   │      │  :3006   │      │  :3007    │
   └────┬─────┘      └────┬────┘      └────┬─────┘      └────┬──────┘
        │                 │                 │                 │
   ┌────▼─────┐      ┌────▼────┐      ┌────▼─────┐      ┌────▼──────┐
   │DB-Calendar│     │DB-Messages│    │DB-Shopping│     │DB-Documents│
   └──────────┘      └─────────┘      └──────────┘      └───────────┘

                    ┌──────────────────┐
                    │  Message Broker  │
                    │ (RabbitMQ/Redis) │
                    │  - Events        │
                    │  - Async Tasks   │
                    └──────────────────┘
                             ▲
                             │
                    (Tous les services)

                    ┌──────────────────┐
                    │  Email Service   │
                    │    (Worker)      │
                    │   :3008          │
                    └──────────────────┘
```

### Caractéristiques Microservices

- **Isolation** : Chaque service est indépendant avec sa propre DB
- **Scalabilité** : Peut scaler les services individuellement
- **Déploiement** : Déploiements indépendants par service
- **Technologie** : Possibilité d'utiliser différentes techs par service
- **Résilience** : La panne d'un service n'affecte pas les autres

---

## 🗄️ Modèle de Données

### Tables PostgreSQL (Prisma Schema)

```prisma

model Family {
  id          String    @id @default(uuid())
  name        String
  description String?
  avatar      String?
  createdById String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
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
  invitedBy String
  createdAt DateTime  @default(now())

  familyId  String
  family    Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
}

// ============================================
// CALENDAR & EVENTS
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
  createdBy   User      @relation(fields: [createdById], references: [id])

  @@index([familyId, startDate])
}

// ============================================
// MESSAGES & FEED
// ============================================

model Message {
  id          String    @id @default(uuid())
  content     String
  type        String    @default("text") // text, image, file
  attachments Json?     // URLs des fichiers
  createdAt   DateTime  @default(now())

  familyId    String
  family      Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])

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
// DOCUMENTS & FILES
// ============================================
model Document {
  id          String    @id @default(uuid())
  name        String
  type        String    // invoice, contract, photo, other
  url         String    // Cloudinary URL
  publicId    String    // Cloudinary public_id for deletion
  size        Int       // in bytes
  mimeType    String
  uploadedAt  DateTime  @default(now())

  familyId    String
  family      Family    @relation(fields: [familyId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy  User      @relation("UploadedBy", fields: [uploadedById], references: [id])

  @@index([familyId, type])
}
```

### Avantages de ce Schéma

- **Relations SQL natives** : JOIN faciles et performants
- **Transactions ACID** : Cohérence garantie
- **Cascade deletes** : Suppression automatique des données liées
- **Indexes optimisés** : Queries rapides
- **Simple à comprendre** : Tout au même endroit

---

## 🎓 Plan d'Apprentissage (Phases)

### ⚙️ Phase 0 : Setup & Configuration (2-3 jours)

**Objectif** : Environnement de développement professionnel

#### Actions

1. **Initialiser le projet**

   ```bash
   mkdir noo
   cd noo
   mkdir frontend backend docs
   git init
   ```

2. **Setup Frontend**

   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install
   # Installer les dépendances (liste détaillée fournie)
   ```

3. **Setup Backend**

   ```bash
   cd backend
   bun init
   # Installer ElysiaJS, Prisma, Better-Auth
   ```

4. **Configuration outils**
   - ESLint + Prettier (formatage cohérent)
   - Git hooks avec Husky (qualité du code)
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
   - Créer le modèle User
   - Première migration
   - Tester requêtes basiques

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

1. **Modèles Prisma**
   - Family, FamilyMember
   - Relations complexes

2. **API Families**
   - POST /api/families (créer famille)
   - GET /api/families (liste familles user)
   - GET /api/families/:id (détails)
   - PATCH /api/families/:id (modifier)
   - DELETE /api/families/:id (supprimer)

3. **API Members**
   - POST /api/families/:id/invite (générer invitation)
   - POST /api/families/join (rejoindre via code/email)
   - DELETE /api/families/:id/members/:userId (retirer membre)
   - PATCH /api/families/:id/members/:userId/role (changer rôle)

4. **Service Email**
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

- Relations many-to-many avec Prisma
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

1. **Modèle Event**
   - Événements avec dates
   - Lien vers famille

2. **API Events**
   - CRUD complet
   - GET /api/families/:id/events?start=&end= (filtrage par dates)
   - Support événements récurrents (optionnel pour v2)

#### Frontend

1. **Composant Calendrier**
   - Vue mensuelle (grille)
   - Vue hebdomadaire (optionnel)
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

**Tests** :

- Créer événements passés/futurs
- Événements sur plusieurs jours
- Tester sur mobile (responsive)

---

### 💬 Phase 4 : Messages & Feed (1 semaine)

**Objectif** : Fil d'actualité familial

#### Backend

1. **Modèle Message**
   - Messages texte + support fichiers

2. **API Messages**
   - POST /api/families/:id/messages
   - GET /api/families/:id/messages (pagination)
   - DELETE /api/messages/:id
   - Support upload images

3. **WebSocket (optionnel v2)**
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

3. **Temps réel (optionnel)**
   - Connexion WebSocket
   - Nouveaux messages sans refresh

**Apprentissages** :

- Pagination et infinite scroll
- WebSocket (temps réel)
- Upload et preview fichiers
- Optimistic updates pour UX fluide

---

### 🛒 Phase 5 : Liste de Courses (4-5 jours)

**Objectif** : Listes collaboratives avec items cochables

#### Backend

1. **Modèles**
   - ShoppingList, ShoppingListItem

2. **API Shopping**
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
   - Affichage qui a ajouté l'item

**Apprentissages** :

- Relations imbriquées (liste -> items)
- Interactions rapides (checkbox, ajout)
- Drag & drop (optionnel pour réorganiser)

---

### 📄 Phase 6 : Documents & Factures (4-5 jours)

**Objectif** : Stockage et organisation de documents

#### Backend

1. **Modèle Document**
   - Métadonnées fichiers

2. **API Documents**
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
   - Configuration Dockerfile (si nécessaire)
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

**Apprentissages** :

- Processus de déploiement
- CI/CD automatique
- Monitoring et erreurs en production

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

### Concepts Clés à Maîtriser

1. **TypeScript** : Types, interfaces, generics
2. **React** : Hooks, context, composition
3. **State Management** : Zustand vs Context vs React Query
4. **API Design** : RESTful principles, versioning
5. **Database** : Relations, indexes, migrations
6. **Security** : JWT, CORS, XSS, CSRF protection
7. **Performance** : Code splitting, lazy loading, caching

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
- [ ] Pull requests avec description

### Tests Manuels

- [ ] Tester happy path
- [ ] Tester cas d'erreur
- [ ] Tester sur mobile
- [ ] Tester avec données réelles

### Performance

- [ ] Pas de re-renders inutiles
- [ ] Images optimisées
- [ ] Lazy loading des routes

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

**Total estimé : 8-10 semaines** (à temps partiel, ~15h/semaine)

- Phase 0 : 2-3 jours
- Phase 1 : 7 jours
- Phase 2 : 7 jours
- Phase 3 : 7 jours
- Phase 4 : 7 jours
- Phase 5 : 5 jours
- Phase 6 : 5 jours
- Phase 7 : 7 jours
- Phase 8 : 5 jours

**Conseil** : Ne pas se précipiter. Mieux vaut bien maîtriser chaque phase avant de passer à la suivante.

---

## 🔄 Évolutions Futures (v2+)

### Fonctionnalités Avancées

- 📊 **Dashboard Analytics** : Statistiques d'utilisation familiale
- 💰 **Gestion Budget** : Suivi dépenses partagées
- 🎂 **Rappels Automatiques** : Anniversaires, événements récurrents
- 🗳️ **Système de Votes** : Décisions familiales collaboratives
- 📍 **Localisation** : Partage position en temps réel (optionnel)
- 🤖 **Notifications Push** : WebPush API pour événements importants
- 🌐 **i18n** : Support multi-langues
- 🌙 **Dark Mode** : Thème sombre
- 📱 **App Mobile Native** : React Native (si nécessaire)

### Améliorations Techniques

- Tests automatisés (Vitest, Playwright)
- CI/CD avancé
- Monitoring (Sentry, LogRocket)
- Analytics (Posthog, Plausible)
- Rate limiting et sécurité avancée
- GraphQL avec Apollo (alternative REST)

---

## 💡 Conseils pour Maximiser l'Apprentissage

### Pendant le Développement

1. **Lire la documentation** plutôt que copier-coller du code
2. **Comprendre le "pourquoi"** de chaque choix technique
3. **Expérimenter** : tester différentes approches
4. **Commenter** le code complexe pour solidifier la compréhension
5. **Debugger** sans ChatGPT d'abord (console, breakpoints)

### Bonnes Pratiques

1. **Git commits réguliers** : historique clair de progression
2. **README à jour** : documenter au fur et à mesure
3. **Refactoring continu** : améliorer le code existant
4. **Code reviews** : relire son propre code après 24h
5. **Journal de bord** : noter blocages et solutions

### Éviter les Pièges

- ❌ Copier du code sans comprendre
- ❌ Ajouter trop de features d'un coup
- ❌ Ignorer les erreurs TypeScript
- ❌ Négliger le responsive design
- ❌ Oublier la gestion d'erreurs
- ❌ Ne pas tester sur différents navigateurs/devices

---

## 📞 Prochaines Étapes

1. **Valider ce plan** : Ajustements si nécessaire
2. **Setup environnement** : Installer outils (Node, Bun, VS Code extensions)
3. **Créer repo GitHub** : Versionner dès le début
4. **Commencer Phase 0** : Setup projet

**Prêt à démarrer ?** 🚀

Je peux vous aider à :

- Générer les fichiers de configuration initiaux
- Créer les commandes d'installation
- Détailler une phase spécifique
- Répondre à des questions techniques

**Bonne chance pour votre apprentissage !** 💪
