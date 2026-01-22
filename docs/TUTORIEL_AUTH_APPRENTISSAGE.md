# 🎓 Tutoriel d'Apprentissage - Authentification avec Better Auth

> **Objectif pédagogique :** Apprendre à construire un système d'authentification complet en comprenant chaque étape.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Prisma 7 configuré avec PostgreSQL + adapter `@prisma/adapter-pg`
- ✅ Base de données Supabase connectée
- ✅ Schéma Better Auth généré avec 4 tables :
  - `User` : Informations utilisateur (id, name, email, emailVerified, image)
  - `Session` : Sessions actives (token, expiresAt, ipAddress, userAgent)
  - `Account` : Comptes liés (providerId, password, tokens OAuth)
  - `Verification` : Codes de vérification email
- ✅ Backend Elysia fonctionnel
- ✅ Frontend React avec Vite + shadcn/ui configuré

---

## 🎯 Objectif Final

Créer une application avec :

1. Un backend qui gère l'authentification (création compte, connexion, déconnexion)
2. Un frontend avec formulaires de connexion/inscription
3. Une gestion des sessions (savoir si l'utilisateur est connecté)
4. Des validations de formulaire avec Zod + React Hook Form

---

## Phase 1 : Comprendre l'Architecture (15 min)

### 📖 Concepts à maîtriser

#### Qu'est-ce qu'une authentification ?

- L'utilisateur donne ses identifiants (email + mot de passe)
- Le serveur vérifie si c'est correct
- Si oui, le serveur crée une **session**
- Le navigateur garde un **cookie** pour se souvenir

#### Comment Better Auth fonctionne ?

- **Backend** : Better Auth crée des routes automatiques (`/api/auth/*`)
- **Frontend** : Un client envoie des requêtes à ces routes
- **Session** : Stockée dans la base de données + cookie dans le navigateur

### ✍️ Exercice de compréhension

**Questions à vous poser :**

1. Où sont stockées les informations de l'utilisateur ? (indice : table `User` dans PostgreSQL/Supabase)
2. Comment le navigateur "se souvient" que vous êtes connecté ? (indice : cookie contenant le `token` de la table `Session`)
3. Quelle est la différence entre s'inscrire et se connecter ?
4. À quoi sert la table `Verification` ? (indice : confirmation d'email)
5. Pourquoi avons-nous besoin de la table `Account` ? (indice : plusieurs méthodes de connexion)

**🔍 Exploration de votre schéma Prisma :**

Ouvrez `backend/prisma/schema.prisma` et observez :

- **User** : Remarquez `emailVerified` (sera utile pour la vérification d'email)
- **Session** : Le champ `token` est unique et sert à identifier la session
- **Account** : Le champ `password` stocke le mot de passe hashé (jamais en clair !)
- **Verification** : Sera utilisé pour stocker les codes de confirmation

---

## Phase 2 : Configuration du Backend (30 min)

### Étape 1 : Créer les routes d'authentification

**📁 Fichier :** `backend/index.ts`

**Ce que vous devez faire :**

1. Importer Elysia et CORS
2. Importer l'objet `auth` depuis `./src/lib/auth`
3. Créer une route qui capture TOUTES les requêtes vers `/api/auth/*`
4. Passer ces requêtes à `auth.handler()`

**💡 Indices :**

- Pour capturer toutes les méthodes HTTP (GET, POST, etc.) : `.all()`
- Le handler de Better Auth attend un objet `Request`
- N'oubliez pas d'activer CORS pour le frontend !

**🤔 Questions de réflexion :**

- Pourquoi utilise-t-on `/api/auth/*` et pas juste `/auth/*` ?
- À quoi sert CORS ? Que se passe-t-il si on l'oublie ?

### Étape 2 : Tester le backend

**📝 À faire :**

1. Démarrer le serveur backend avec `bun run index.ts`
2. Visiter `http://localhost:3000` dans le navigateur
3. Tester les routes Better Auth :
   - `http://localhost:3000/api/auth/session` (devrait retourner `null`)
   - `http://localhost:3000/api/auth/get-session` (alternative)

**✅ Critères de réussite :**

- Le serveur démarre sans erreur
- Vous voyez "Backend is running!" sur `http://localhost:3000`
- `/api/auth/session` retourne une réponse JSON (probablement `{"user": null, "session": null}`)

**⚠️ Note importante :**
`/api/auth/` seul **ne fonctionne pas** ! C'est normal. Better Auth a des routes spécifiques :

- `GET /api/auth/session` - Récupère la session
- `POST /api/auth/sign-in/email` - Connexion
- `POST /api/auth/sign-up/email` - Inscription
- `POST /api/auth/sign-out` - Déconnexion

---

## Phase 3 : Installation Frontend (10 min)

### Étape 3 : Installer Better Auth côté client

**📝 À faire :**

1. Naviguer vers le dossier frontend
2. Installer le package `better-auth`

**💡 Commande :** Utilisez votre gestionnaire de packages (bun, npm, etc.)

### Étape 4 : Installer shadcn/ui pour les formulaires

**📝 À faire :**

1. Installer les composants nécessaires : `form`, `input`, `button`, `card`, `label`
2. Installer les dépendances de validation : `react-hook-form`, `@hookform/resolvers`, `zod`

**🤔 Question :**

- Pourquoi utilise-t-on shadcn/ui plutôt que des `<input>` HTML simples ?

---

## Phase 4 : Client d'Authentification (20 min)

### Étape 5 : Créer le client Better Auth

**📁 Fichier à créer :** `frontend/src/lib/auth.ts`

**Ce que vous devez faire :**

1. Importer `createAuthClient` depuis `better-auth/react`
2. Créer un client avec l'URL de votre backend
3. Exporter les fonctions utiles : `signIn`, `signUp`, `signOut`, `useSession`

**💡 Indices :**

- L'URL du backend est `http://localhost:3000`
- Ces exports seront utilisés partout dans votre app
- `useSession` est un **hook React**, les autres sont des **fonctions**

**🤔 Questions de réflexion :**

- Pourquoi crée-t-on un fichier séparé pour ça ?
- Quelle est la différence entre un hook et une fonction normale ?

---

## Phase 5 : Schémas de Validation Zod (30 min)

### Étape 6 : Créer les schémas de validation

**📁 Fichier à créer :** `frontend/src/schemas/auth.ts`

**Ce que vous devez faire :**

#### Schema d'inscription

Créer un schéma qui valide :

- **name** : au moins 2 caractères
- **email** : format email valide
- **password** :
  - Minimum 8 caractères
  - Au moins une majuscule
  - Au moins un chiffre
- **confirmPassword** : doit correspondre au password

#### Schema de connexion

Créer un schéma qui valide :

- **email** : format email valide
- **password** : requis (pas besoin de règles complexes ici)

**💡 Indices :**

- Utilisez `z.object()` pour créer un schéma
- Pour les regex : `.regex(/[A-Z]/, "message")`
- Pour comparer deux champs : `.refine()`
- Pour les messages d'erreur : deuxième argument des validateurs

**🤔 Questions :**

- Pourquoi valider côté client alors que le serveur valide aussi ?
- Que se passe-t-il si quelqu'un désactive JavaScript ?

### Étape 7 : Comprendre les types TypeScript

**📝 À faire :**

1. Créer des types TypeScript à partir de vos schémas Zod
2. Les exporter pour les utiliser dans vos composants

**💡 Indice :** `z.infer<typeof votreSchema>`

---

## Phase 6 : Composants de Formulaire (60 min)

### Étape 8 : Créer le formulaire d'inscription

**📁 Fichier à créer :** `frontend/src/components/SignUpForm.tsx`

**Ce que vous devez faire :**

#### Structure du composant

1. Utiliser `useForm` de `react-hook-form`
2. Configurer avec le resolver Zod
3. Créer une fonction `onSubmit` qui appelle `signUp.email()`
4. Gérer les erreurs potentielles

#### Champs du formulaire

Créer des champs pour :

- Nom (type text)
- Email (type email)
- Mot de passe (type password)
- Confirmation mot de passe (type password)

#### Utiliser shadcn/ui

- Envelopper dans un `<Card>`
- Utiliser `<FormField>` pour chaque champ
- Afficher `<FormMessage>` pour les erreurs
- Ajouter un `<Button>` de soumission

**💡 Conseils :**

- Les erreurs de validation s'affichent automatiquement !
- Utilisez `async/await` pour `signUp.email()`
- Pensez à gérer le cas de succès et d'échec

**🤔 Questions :**

- Que se passe-t-il si l'email existe déjà ?
- Comment améliorer l'UX pendant le chargement ?

### Étape 9 : Créer le formulaire de connexion

**📁 Fichier à créer :** `frontend/src/components/SignInForm.tsx`

**Ce que vous devez faire :**
Similaire à l'inscription, mais plus simple :

- Seulement email et mot de passe
- Appeler `signIn.email()` au lieu de `signUp.email()`
- Valider avec le schéma de connexion

**💡 Astuce :** Vous pouvez copier la structure du formulaire d'inscription et l'adapter.

### Étape 10 : Créer un système d'onglets

**📁 Fichier à créer :** `frontend/src/components/AuthTabs.tsx`

**Ce que vous devez faire :**

1. Installer et utiliser le composant `Tabs` de shadcn/ui
2. Créer deux onglets : "Connexion" et "Inscription"
3. Afficher le bon formulaire selon l'onglet actif

**🤔 Question :**

- Pourquoi est-ce mieux qu'avoir deux pages séparées ?

---

## Phase 7 : Gestion de Session (30 min)

### Étape 11 : Afficher l'utilisateur connecté

**📁 Fichier :** `frontend/src/App.tsx`

**Ce que vous devez faire :**

#### Utiliser le hook useSession

1. Importer et utiliser `useSession()`
2. Récupérer les données de session

#### Affichage conditionnel

- **Si connecté** : Afficher nom, email, bouton "Se déconnecter"
- **Si non connecté** : Afficher le composant `<AuthTabs>`

**💡 Indices :**

- `useSession()` retourne `{ data: session, isPending, error }`
- Pendant le chargement, `session` est `null`
- Utilisez un opérateur ternaire : `session ? ... : ...`

**🤔 Questions :**

- Que se passe-t-il quand on recharge la page ?
- Comment Better Auth sait-il que vous êtes connecté ? (indice : cookie avec le `token`)
- Regardez dans les DevTools > Application > Cookies : vous verrez le cookie de session

**🔍 Comprendre la structure de session :**

```typescript
session = {
  user: {
    id: "...",
    name: "...",
    email: "...",
    emailVerified: true / false,
    image: "...", // peut être null
  },
  session: {
    token: "...",
    expiresAt: "...",
    userId: "...",
  },
};
```

### Étape 12 : Implémenter la déconnexion

**📝 À faire :**

1. Créer un bouton "Se déconnecter"
2. Appeler `signOut()` au clic
3. Vérifier que la session est bien supprimée

**💡 Indice :** `signOut()` est une fonction asynchrone

**🔍 Ce qui se passe en coulisses :**

- La session est supprimée de la table `Session` dans la base de données
- Le cookie est supprimé du navigateur
- `useSession()` retourne maintenant `null`

---

## Phase 8 : Tests et Améliorations (45 min)

### Étape 13 : Tester le flux complet

**✅ Liste de tests à effectuer :**

1. **Inscription**
   - [ ] Tester avec des données invalides (email incorrect, mot de passe trop court)
   - [ ] Vérifier que les messages d'erreur s'affichent
   - [ ] S'inscrire avec des données valides
   - [ ] Vérifier que vous êtes automatiquement connecté après inscription

2. **Connexion**
   - [ ] Tester avec un email qui n'existe pas
   - [ ] Tester avec un mauvais mot de passe
   - [ ] Se connecter avec les bons identifiants
   - [ ] Vérifier que les infos s'affichent

3. **Session**
   - [ ] Recharger la page (F5) - êtes-vous toujours connecté ?
   - [ ] Fermer et rouvrir le navigateur - êtes-vous toujours connecté ?
   - [ ] Se déconnecter et vérifier que ça marche

4. **Base de données**
   - [ ] Ouvrir Supabase et vérifier la table `user` : votre utilisateur doit apparaître
   - [ ] Vérifier la table `session` : une session active doit exister avec votre `userId`
   - [ ] Vérifier la table `account` : un compte avec `providerId: "credential"` et `password` hashé
   - [ ] Après déconnexion, vérifier que la session a été supprimée de la table `session`

**🔍 Exploration de la base de données :**

Connectez-vous à Supabase et exécutez ces requêtes SQL pour comprendre :

```sql
-- Voir tous vos utilisateurs
SELECT id, name, email, "emailVerified", "createdAt" FROM "user";

-- Voir les sessions actives
SELECT id, token, "expiresAt", "userId" FROM "session";

-- Voir les comptes (avec mot de passe hashé)
SELECT id, "providerId", "userId", password FROM "account";
```

### Étape 14 : Améliorations UX

**Challenges à relever :**

#### Challenge 1 : Toast de notification

- Afficher un message de succès après inscription
- Afficher un message d'erreur en cas d'échec
- **Indice :** Utilisez le composant `toast` de shadcn/ui

#### Challenge 2 : État de chargement

- Désactiver le bouton pendant la requête
- Afficher un spinner
- **Indice :** `form.formState.isSubmitting`

#### Challenge 3 : Redirection

- Rediriger vers une page "Dashboard" après connexion
- **Indice :** React Router ou simple state

#### Challenge 4 : Validation en temps réel

- Afficher les erreurs au fur et à mesure de la saisie
- Indicateur de force du mot de passe
- **Indice :** Mode de validation dans `useForm`

---

## Phase 9 : Sécurité et Bonnes Pratiques (30 min)

### Étape 15 : Améliorer la sécurité

**📝 Checklist de sécurité :**

#### Côté Backend

- [ ] Les mots de passe sont-ils hashés ? (Oui, Better Auth le fait et les stocke dans `Account.password`)
- [ ] HTTPS en production (actuellement HTTP en dev)
- [ ] Variables d'environnement sécurisées (votre `DATABASE_URL` est dans `.env`)
- [ ] Rate limiting sur les routes d'auth (limite de tentatives)

**🔍 Vérification dans votre base de données :**

- Ouvrez Supabase et regardez la table `account`
- Le champ `password` ne contient JAMAIS le mot de passe en clair
- C'est un hash (ex: `$2a$10$...`) créé avec bcrypt

#### Côté Frontend

- [ ] Ne jamais logger les mots de passe dans `console.log()`
- [ ] Validation stricte des formulaires avec Zod
- [ ] Messages d'erreur génériques (ne pas dire "email existe déjà")
- [ ] Pas de données sensibles dans les erreurs exposées

**🤔 Questions de réflexion :**

- Pourquoi ne doit-on jamais dire "cet email existe déjà" ?
- Qu'est-ce qu'une attaque par force brute ?

### Étape 16 : Accessibilité

**📝 À vérifier :**

- [ ] Tous les champs ont des labels
- [ ] Navigation au clavier fonctionne (Tab)
- [ ] Les erreurs sont annoncées aux lecteurs d'écran
- [ ] Contraste des couleurs suffisant

---

## 🎯 Exercices Bonus

### Exercice 1 : Vérification d'email

Implémenter la vérification d'email (utilise la table `Verification`) :

1. Activer `requireEmailVerification` dans `backend/src/lib/auth.ts`
2. Configurer l'envoi d'emails (Resend ou autre service)
3. Créer une page de confirmation avec le code
4. Mettre à jour `User.emailVerified` après validation

**💡 Indices :**

- La table `Verification` stocke `identifier` (email), `value` (code) et `expiresAt`
- Better Auth génère automatiquement les codes
- Vous devez juste configurer l'envoi d'emails

### Exercice 2 : Authentification sociale (Google/GitHub)

Ajouter l'authentification OAuth (utilise la table `Account`) :

1. Créer une application OAuth sur Google Cloud ou GitHub
2. Configurer dans Better Auth avec `clientId` et `clientSecret`
3. Ajouter le bouton dans le formulaire
4. Tester le flux complet

**🔍 Ce qui se passe :**

- Un enregistrement est créé dans `Account` avec `providerId: "google"` ou `"github"`
- Les tokens OAuth sont stockés dans `accessToken`, `refreshToken`, `idToken`
- Le champ `password` reste `null` pour les comptes sociaux

### Exercice 3 : Informations de session avancées

Exploiter les données de la table `Session` :

1. Afficher l'adresse IP de connexion (`Session.ipAddress`)
2. Afficher le navigateur utilisé (`Session.userAgent`)
3. Afficher la date de dernière connexion (`Session.updatedAt`)
4. Permettre de déconnecter toutes les sessions sauf la courante

**💡 Indice :**

- Une même personne peut avoir plusieurs sessions (téléphone, ordinateur, etc.)
- Chaque session a un `token` unique

### Exercice 4 : Profil utilisateur

Créer une page de profil qui utilise les champs du modèle `User` :

1. Afficher les infos : `name`, `email`, `image`, `emailVerified`
2. Permettre de modifier le `name`
3. Permettre de télécharger une photo de profil (`image` - URL)
4. Afficher un badge si `emailVerified === true`
5. Afficher `createdAt` (membre depuis...)

**🔍 Champs disponibles dans votre modèle User :**

```prisma
id            String    @id
name          String
email         String
emailVerified Boolean   @default(false)
image         String?   // URL de la photo
createdAt     DateTime
updatedAt     DateTime
```

---

## 📊 Critères d'Évaluation

**Vous avez réussi si :**

### ✅ Fonctionnalités

- [ ] Un utilisateur peut s'inscrire
- [ ] Un utilisateur peut se connecter
- [ ] Un utilisateur peut se déconnecter
- [ ] La session persiste après rechargement
- [ ] Les erreurs sont gérées correctement

### ✅ Code Quality

- [ ] Le code est organisé (composants séparés)
- [ ] Types TypeScript corrects
- [ ] Validations côté client et serveur
- [ ] Gestion d'erreur propre (try/catch)

### ✅ UX/UI

- [ ] Interface claire et intuitive
- [ ] Messages d'erreur utiles
- [ ] Retours visuels (loading, success, error)
- [ ] Responsive (fonctionne sur mobile)

---

## 🔍 Questions de Débriefing

Après avoir terminé, réfléchissez à :

1. **Architecture**
   - Pourquoi sépare-t-on frontend et backend ?
   - Quel est le rôle exact de Better Auth ?

2. **Sécurité**
   - Comment sont stockés les mots de passe ?
   - Comment fonctionne une session ?
   - Qu'est-ce qu'un cookie httpOnly ?

3. **React**
   - Quelle est la différence entre state et props ?
   - Comment fonctionne useForm ?
   - Pourquoi utiliser des hooks personnalisés ?

4. **TypeScript**
   - Quels avantages avez-vous trouvés ?
   - Comment Zod aide-t-il TypeScript ?

---

## 📚 Ressources pour Aller Plus Loin

### Documentation

- [Better Auth - Concepts](https://www.better-auth.com/docs/concepts)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

### Tutoriels

- OAuth 2.0 expliqué simplement
- JWT vs Sessions
- CORS en détail

### Prochaines étapes

1. Apprendre Next.js pour le SSR (Server-Side Rendering)
2. Implémenter 2FA (authentification à deux facteurs)
3. Ajouter des rôles et permissions
4. Audit de sécurité

---

## 💪 Vous êtes prêt !

**Conseils pour réussir :**

- Allez à votre rythme
- Testez régulièrement
- Lisez les messages d'erreur attentivement
- Consultez la documentation
- N'hésitez pas à demander de l'aide si vous bloquez

**Bonne chance ! 🚀**
