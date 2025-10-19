-- ==========================================================
-- Migration initiale : création du schéma de base
-- Auteur : Jordan
-- Date : 17 octobre 2025
-- ==========================================================

-- TABLE CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  created_at timestamp with time zone default now()
);

-- TABLE TRANSPORTS
create table if not exists transports (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  telephone text,
  created_at timestamp with time zone default now()
);

-- TABLE PRODUITS
create table produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  poids numeric,
  dimensions text,
  created_at timestamp with time zone default now()
);

-- TABLE CHARGEMENTS
create table chargements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  transport_id uuid references transports(id) on delete cascade,
  date_chargement date not null default current_date,
  created_at timestamp with time zone default now()
);

-- TABLE CHARGEMENT_PRODUITS (liaison entre chargement et produits)
create table chargement_produits (
  id uuid primary key default gen_random_uuid(),
  chargement_id uuid references chargements(id) on delete cascade,
  produit_id uuid references produits(id) on delete cascade,
  quantite integer not null check (quantite > 0)
);

-- ==========================================================
-- Contraintes & index
-- ==========================================================
alter table chargement_produits
  add constraint chargement_produits_unique unique (chargement_id, produit_id);

create index if not exists idx_chargement_produits_chargement
  on chargement_produits (chargement_id);

-- ==========================================================
-- Sécurité : activation du RLS (Row Level Security)
-- ==========================================================
alter table clients enable row level security;
alter table transports enable row level security;
alter table produits enable row level security;
alter table chargements enable row level security;
alter table chargement_produits enable row level security;

-- ==========================================================
-- Politiques de développement (lecture/écriture publiques)
-- ==========================================================
create policy "Lecture publique" on clients for select using (true);
create policy "Insertion publique" on clients for insert with check (true);

create policy "Lecture publique" on transports for select using (true);
create policy "Insertion publique" on transports for insert with check (true);

create policy "Lecture publique" on produits for select using (true);
create policy "Insertion publique" on produits for insert with check (true);

create policy "Lecture publique" on chargements for select using (true);
create policy "Insertion publique" on chargements for insert with check (true);

create policy "Lecture publique" on chargement_produits for select using (true);
create policy "Insertion publique" on chargement_produits for insert with check (true);

-- Autorise la mise à jour des lignes existantes dans la table chargement_produits
create policy "Mise à jour publique"
  on chargement_produits
  for update
  using (true)
  with check (true);

-- UPDATE sur CHARGEMENTS 
create policy "Mise à jour publique"
  on chargements
  for update
  using (true)
  with check (true);

-- DELETE sur CHARGEMENT_PRODUITS (pour pouvoir supprimer des lignes)
create policy "Suppression publique"
  on chargement_produits
  for delete
  using (true);

-- DELETE sur CHARGEMENTS (pour supprimer un chargement entier)
create policy "Suppression publique"
  on chargements
  for delete
  using (true);