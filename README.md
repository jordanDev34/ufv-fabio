# UFV – Gestion des chargements

Application Next.js pour gérer des chargements clients / transporteurs / produits à l’aide de Supabase. 
Permet la visualisation des 'chargements' créés, l'ajout, l'édition et la suppression. (CRUD)

---

## Stack technique
- **Next.js 15**
- **Supabase**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

---

## Lancer le projet

### 1. Prérequis
- Node.js ≥ 18.18 (Dockeurisation plus tard)  
- npm  
- Un projet Supabase actif (compte gratuit OK)

---

### 2. Cloner le projet et installer les dépendances
```bash
git clone https://github.com/jordanDev34/ufv-fabio.git
cd ufv-fabio
npm install
```

---

### 3. Configuration des variables d’environnement

Un fichier d’exemple `.env.example` est déjà présent à la racine du projet.  
Crée un fichier `.env.local` à partir de celui-ci (consignes dans le fichier .env.example).

---

### 4 Lancer le serveur de développement

```bash
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000)

---

## Configurer Supabase

### 1 Création du schéma de base

Le script SQL complet est disponible dans :
```
lib/supabase/migrations/2025-10-17_init_tables.sql
```

Ce script crée :
- Les tables : `clients`, `transports`, `produits`, `chargements`, `chargement_produits`
- Les clés étrangères (avec suppression en cascade)
- Les contraintes (`unique`, `check`)
- L’activation du RLS (Row Level Security)
- Des policies de développement (lecture, écriture et suppression publiques)

**Étapes à suivre :**
1. Copie le contenu du script SQL.  
2. Ouvre ton projet Supabase => **SQL Editor**.  
3. Colle le script et clique sur **Run** pour l’exécuter.  
4. Ensuite, va dans **Table Editor** et ajoute quelques données dans les tables :  
   - `clients`  
   - `produits`  
   - `transports`  

Cela te permettra ensuite de créer des chargements depuis l’interface de l’application.

---

### 2 Authentification — Redirections

Dans Supabase :
- Va dans **Authentication → URL Configuration → Redirect URLs**
- Ajoute :
  ```
  http://localhost:3000/auth/callback
  ```
  (+ l’URL de production si tu déploies sur Vercel)

---

### 3 Créer un utilisateur de test

Depuis l’interface Supabase, allez dans **"Authentication" => "Users" => Add user** :
- Email : `demo@exemple.com`
- Mot de passe : ton choix

Tu pourras ensuite te connecter depuis `/login` (2 Méthodes de connexion proposées par Supabase):
- via **mot de passe** (mais ajout d'abord email+mdp depuis l'interface comme expliqué plus haut)
- ou **connexion par e-mail** (OTP, lien envoyé par mail => 'magic link' dans la doc)
---

## Accès et sécurité

Les routes suivantes sont protégées par le middleware Supabase :
- `/chargements`
- `/nouveau-chargement`
- et leurs sous-routes (`/chargements/:id/edit`)

Si l’utilisateur n’est pas connecté, il est automatiquement redirigé vers `/login`.

---

## Déploiement (optionnel)
Déploiement possible sur **Vercel** :
- Renseigne les variables d’environnement :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Ajoute dans Supabase :
  ```
  https://votre-projet.vercel.app/auth/callback
  ```

---

## Autre
Projet personnel, merci pour votre attention et vos remarques constructives.
