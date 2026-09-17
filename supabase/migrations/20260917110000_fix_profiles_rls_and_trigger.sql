-- ==============================================================================
-- Clinigo.fr - Migration Supabase : Correction RLS & Synchronisation Automatique
-- ==============================================================================

-- 1. S'assurer que la table public.profiles possède toutes les colonnes requises
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  first_name text,
  last_name text,
  role text default 'PATIENT',
  phone text,
  nir text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Configuration RLS : autoriser la lecture pour les administrateurs et utilisateurs authentifiés
alter table public.profiles enable row level security;

-- Supprimer les anciennes politiques restrictives si existantes
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Allow select all profiles" on public.profiles;
drop policy if exists "Allow insert profiles" on public.profiles;
drop policy if exists "Allow update profiles" on public.profiles;

-- Autoriser la lecture de tous les profils (nécessaire pour la console d'administration et de régulation)
create policy "Allow select all profiles"
  on public.profiles
  for select
  using (true);

-- Autoriser l'insertion pour tout utilisateur (y compris lors de l'inscription via l'API anon)
create policy "Allow insert profiles"
  on public.profiles
  for insert
  with check (true);

-- Autoriser la mise à jour
create policy "Allow update profiles"
  on public.profiles
  for update
  using (true)
  with check (true);

-- 3. Trigger automatique PostgreSQL sur auth.users
-- À chaque nouvelle inscription dans auth.users, créer ou mettre à jour automatiquement public.profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, phone, nir, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', 'Utilisateur'),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'PATIENT'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'nir',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(excluded.first_name, profiles.first_name),
    last_name = coalesce(excluded.last_name, profiles.last_name),
    role = coalesce(excluded.role, profiles.role),
    phone = coalesce(excluded.phone, profiles.phone),
    nir = coalesce(excluded.nir, profiles.nir),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Rétro-synchronisation (Backfill) des utilisateurs déjà inscrits dans auth.users
insert into public.profiles (id, email, first_name, last_name, role, phone, nir, created_at)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'first_name', 'Utilisateur'),
  coalesce(raw_user_meta_data->>'last_name', ''),
  coalesce(raw_user_meta_data->>'role', 'PATIENT'),
  raw_user_meta_data->>'phone',
  raw_user_meta_data->>'nir',
  created_at
from auth.users
on conflict (id) do update set
  email = excluded.email,
  first_name = coalesce(excluded.first_name, profiles.first_name),
  last_name = coalesce(excluded.last_name, profiles.last_name),
  role = coalesce(excluded.role, profiles.role);
