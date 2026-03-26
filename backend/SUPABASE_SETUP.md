# Configuration du backend Supabase

Ce projet utilise **Supabase** comme backend. voici les étapes pour mettre tout en place :

## 1. Créer un projet Supabase
1. Va sur https://app.supabase.com et connecte-toi.
2. Crée un nouveau projet (choisis la région, et note ton mot de passe de base de données).
3. Copie l'URL du projet et la clé `anon` (API URL & anon key) dans un fichier `.env` à la racine de ce dépôt : 

```dotenv
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> **Important** : ne commite jamais `.env` ; il est déjà ignoré par `.gitignore`.

## 2. Schéma de la base de données
Exécute ce script SQL dans l'éditeur SQL de Supabase (ou via le CLI `supabase db push`) :

```sql
-- utilisateurs
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  user_type text check (user_type in ('jeune','entreprise','admin')) not null,
  nom text not null,
  prenom text,
  telephone text,
  ville text,
  created_at timestamp with time zone default now()
);

-- profils jeunes
create table jeune_profiles (
  user_id uuid references users(id) on delete cascade,
  date_naissance date,
  age int,
  competences text[],
  experience text,
  education text,
  cv text,
  photo text,
  notes_moyenne numeric,
  nombre_evaluations int,
  missions_completees int,
  primary key (user_id)
);

-- profils entreprises
create table entreprise_profiles (
  user_id uuid references users(id) on delete cascade,
  nom_entreprise text,
  secteur_activite text,
  description text,
  adresse text,
  site_web text,
  logo text,
  notes_moyenne numeric,
  nombre_evaluations int,
  missions_publiees int,
  primary key (user_id)
);

-- missions
create table missions (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references users(id) not null,
  entreprise_nom text,
  titre text not null,
  description text,
  competences_requises text[],
  remuneration numeric,
  duree text,
  date_debut date,
  date_fin date,
  lieu text,
  nombre_postes int,
  statut text check (statut in ('ouverte','en_cours','terminée','annulée')) default 'ouverte',
  candidatures_count int default 0,
  created_at timestamp with time zone default now()
);

-- candidatures
create table candidatures (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id) on delete cascade,
  jeune_id uuid references users(id) on delete cascade,
  jeune_nom text,
  jeune_prenom text,
  jeune_photo text,
  jeune_note numeric,
  lettre_motivation text,
  statut text check (statut in ('en_attente','acceptée','refusée')) default 'en_attente',
  date_postulation timestamp with time zone default now(),
  date_reponse timestamp with time zone
);

-- évaluations
create table evaluations (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references missions(id),
  evaluateur_id uuid references users(id),
  evaluateur_nom text,
  evalue_id uuid references users(id),
  note int,
  commentaire text,
  date_evaluation timestamp with time zone default now()
);

-- notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  titre text,
  message text,
  type text check (type in ('candidature','acceptation','refus','evaluation','mission')),
  lu boolean default false,
  created_at timestamp with time zone default now()
);
```

Tu peux adapter les noms de colonnes (camelCase&nbsp;↔ snake_case) si nécessaire.

## 3. RLS et politiques
Active les Row Level Security (`auth > policies`) pour chaque table et crée des politiques basiques, par exemple :

```sql
-- exemple pour les missions publiques
create policy "Public read missions" on missions for select using (true);

-- une entreprise ne peut modifier que ses propres missions
create policy "Entreprise update" on missions
  for update using (auth.uid() = entreprise_id);
```

## 4. Utilisation côté React
Plusieurs helpers sont déjà fournis dans `src/lib/supabaseService.ts` (voir la documentation dans le fichier).  
Exemples :

```ts
import { fetchMissions, fetchMissionById, applyToMission } from "../lib/supabaseService";

// chargement
const missions = await fetchMissions();

// postuler
await applyToMission({
  missionId: "...",
  jeuneId: "...",
  jeuneNom: "...",
  jeunePrenom: "...",
  jeuneNote: 4.5,
  lettreMotivation: "...",
  statut: "en_attente"
});
```

Plusieurs pages (`Missions.tsx`, `MissionDetail.tsx`) ont déjà été converties pour se connecter à l’API.

## 5. Authentification
La configuration actuelle utilise l’auth de Supabase (`signIn`, `signUp` dans `supabaseService.ts`).  
Tu peux appeler `supabase.auth.onAuthStateChange` à l’initialisation de l’app pour maintenir l’état.

## 6. Tests & environnements
- Pour le développement local, utilise le même projet Supabase ou crée-en un second.
- Versionne tes migrations SQL avec le CLI `supabase migration` si tu utilises Git.
## 7. Insertion de données de test

Un exemple de script de peuplement se trouve dans `backend/seed.sql`. Pour charger ces lignes :

```bash
# avec la CLI supabase (après `supabase login` et dans le répertoire du projet)
supabase db query < backend/seed.sql
```

ou simplement copiez‑collez le contenu dans l'éditeur SQL du dashboard et exécutez.

Les tables seront remplies avec des utilisateurs, missions, candidatures et notifications identiques aux objets de `src/app/data.ts`.
---

Ces étapes installent un backend Supabase fonctionnel pour ton application. N’hésite pas à étendre les helpers, to add hooks (React Query, SWR, etc.) or edge functions for complex business logic.