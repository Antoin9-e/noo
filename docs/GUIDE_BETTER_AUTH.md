# 🎓 Guide Better Auth - Étape par étape

## Ce que nous avons déjà configuré ✅

1. **Prisma 7** avec adapter PostgreSQL
2. **Schema Better Auth** généré (tables User, Session, Account, Verification)
3. **Base de données** synchronisée sur Supabase
4. **Client Prisma** configuré dans `backend/src/lib/auth.ts`

## Ce que vous allez apprendre 📚

- Comment créer un serveur d'authentification avec Elysia
- Comment créer un client d'authentification React
- Comment gérer les sessions utilisateur
- La communication entre frontend et backend

---

## Étape 1 : Configurer le Backend (15 min)

### 🎯 Objectif

Créer un serveur API qui gère l'authentification avec Better Auth.

### 📝 À faire

Ouvrez `backend/index.ts` et remplacez le contenu par :

```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./src/lib/auth";

const app = new Elysia()
  .use(cors())
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .get("/", () => "Backend is running!")
  .listen(3000);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);
```

### 💡 Explication ligne par ligne

- **`.use(cors())`** : Active CORS pour permettre au frontend (port 5173) de communiquer avec le backend (port 3000)
- **`.all("/api/auth/*", ...)`** : Toutes les requêtes vers `/api/auth/*` sont gérées par Better Auth
  - `signIn` → `/api/auth/sign-in/email`
  - `signUp` → `/api/auth/sign-up/email`
  - `signOut` → `/api/auth/sign-out`
- **`auth.handler(request)`** : Better Auth traite automatiquement les requêtes d'authentification

### ✅ Testez

```bash
cd backend
bun run index.ts
```

Visitez http://localhost:3000 - vous devriez voir "Backend is running!"

---

## Étape 2 : Installer Better Auth dans le Frontend (5 min)

### 🎯 Objectif

Ajouter la bibliothèque Better Auth côté client.

### 📝 À faire

```bash
cd frontend
bun add better-auth
```

### 💡 Pourquoi ?

Better Auth fournit des hooks React (`useSession`) et des fonctions (`signIn`, `signUp`) pour faciliter l'authentification.

---

## Étape 3 : Créer le Client d'Authentification (10 min)

### 🎯 Objectif

Créer un fichier qui configure la connexion au backend.

### 📝 À faire

Créez `frontend/src/lib/auth.ts` :

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 💡 Explication

- **`createAuthClient`** : Initialise la connexion avec votre backend
- **`baseURL`** : L'adresse de votre serveur backend
- **`signIn`** : Fonction pour connecter un utilisateur
- **`signUp`** : Fonction pour créer un compte
- **`signOut`** : Fonction pour déconnecter
- **`useSession`** : Hook React pour accéder à la session (utilisateur connecté ou non)

---

## Étape 4 : Créer l'Interface d'Authentification (20 min)

### 🎯 Objectif

Créer un formulaire de connexion/inscription avec gestion de session.

### 📝 À faire

Ouvrez `frontend/src/App.tsx` et remplacez par :

```tsx
import { useState } from "react";
import { signIn, signUp, signOut, useSession } from "./lib/auth";
import "./App.css";

function App() {
  // 1. Récupère la session actuelle
  const { data: session } = useSession();

  // 2. États pour les champs du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 3. Fonction d'inscription
  const handleSignUp = async () => {
    await signUp.email({
      email,
      password,
      name,
    });
  };

  // 4. Fonction de connexion
  const handleSignIn = async () => {
    await signIn.email({
      email,
      password,
    });
  };

  return (
    <>
      <h1>Better Auth Demo</h1>

      {/* Si l'utilisateur est connecté */}
      {session ? (
        <div className="card">
          <p>
            ✅ Connecté en tant que <strong>{session.user.name}</strong>
          </p>
          <p>Email: {session.user.email}</p>
          <button onClick={() => signOut()}>Se déconnecter</button>
        </div>
      ) : (
        /* Sinon, affiche le formulaire */
        <div className="card">
          <h2>Authentification</h2>

          <input
            type="text"
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={handleSignIn}>Se connecter</button>
            <button onClick={handleSignUp}>S'inscrire</button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
```

### 💡 Comment ça marche ?

1. **`useSession()`** vérifie automatiquement si un utilisateur est connecté
2. **Affichage conditionnel** : `{session ? ... : ...}`
   - Si `session` existe → Affiche les infos de l'utilisateur
   - Sinon → Affiche le formulaire
3. **`signUp.email()`** envoie une requête à `/api/auth/sign-up/email`
4. **`signIn.email()`** envoie une requête à `/api/auth/sign-in/email`
5. **`signOut()`** déconnecte et supprime la session

---

## Étape 5 : Tester l'Application (10 min)

### 📝 Démarrez les serveurs

**Terminal 1 - Backend :**

```bash
cd backend
bun run index.ts
```

**Terminal 2 - Frontend :**

```bash
cd frontend
bun run dev
```

### ✅ Testez le flux complet

1. Ouvrez http://localhost:5173
2. **Inscrivez-vous** avec un email et mot de passe
3. Vérifiez que vous êtes connecté (nom affiché)
4. **Déconnectez-vous**
5. **Reconnectez-vous** avec les mêmes identifiants

---

## 🔍 Comprendre le Flux de Données

```
Frontend (React)          Backend (Elysia)           Base de données
     │                          │                          │
     │  signUp.email()          │                          │
     ├─────────────────────────>│  Crée l'utilisateur      │
     │                          ├─────────────────────────>│
     │                          │  Retourne le user        │
     │  Session créée           │<─────────────────────────┤
     │<─────────────────────────┤                          │
     │                          │                          │
     │  useSession()            │                          │
     ├─────────────────────────>│  Vérifie la session      │
     │                          ├─────────────────────────>│
     │  Données user            │  Session valide          │
     │<─────────────────────────┤<─────────────────────────┤
```

---

## 📚 Pour aller plus loin

### Ajouter la validation par email

```typescript
// backend/src/lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Ajoutez ceci
  },
});
```

### Ajouter l'authentification sociale (Google, GitHub)

```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

---

## 🎯 Exercices pratiques

1. **Ajoutez un message d'erreur** si la connexion échoue
2. **Ajoutez une validation** : mot de passe minimum 8 caractères
3. **Créez une page protégée** accessible uniquement si connecté
4. **Ajoutez un bouton "Se souvenir de moi"**

---

## 📖 Ressources

- [Documentation Better Auth](https://www.better-auth.com/docs)
- [Prisma 7 Guide](https://www.prisma.io/docs)
- [Elysia Documentation](https://elysiajs.com)

---

**Bon apprentissage ! 🚀**
