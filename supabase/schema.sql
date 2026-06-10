create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('event', 'place')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (type, name)
);

alter table public.categories enable row level security;

drop policy if exists "Public categories are readable" on public.categories;
create policy "Public categories are readable"
on public.categories
for select
to anon
using (is_active = true);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  address text,
  category text,
  image_url text,
  website text,
  phone text,
  working_hours text,
  created_at timestamptz not null default now()
);

alter table public.places enable row level security;

drop policy if exists "Public places are readable" on public.places;
create policy "Public places are readable"
on public.places
for select
to anon
using (true);

alter table public.events
add column if not exists place_id uuid references public.places(id) on delete set null;

create index if not exists events_place_id_idx
on public.events(place_id);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;

drop policy if exists "Public collections are readable" on public.collections;
create policy "Public collections are readable"
on public.collections
for select
to anon
using (is_published = true);

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  entity_type text not null check (entity_type in ('event', 'place')),
  entity_id uuid not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.collection_items enable row level security;

drop policy if exists "Public collection items are readable" on public.collection_items;
create policy "Public collection items are readable"
on public.collection_items
for select
to anon
using (true);

create index if not exists collection_items_collection_id_idx
on public.collection_items(collection_id);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  telegram_id text not null,
  entity_type text not null check (entity_type in ('event', 'place', 'collection')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (telegram_id, entity_type, entity_id)
);

alter table public.favorites enable row level security;

create index if not exists favorites_telegram_id_idx
on public.favorites(telegram_id);

create table if not exists public.users_debug_logs (
  id bigint generated always as identity primary key,
  telegram_id bigint,
  step text not null,
  payload jsonb,
  error jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_debug_logs_telegram_id_created_at_idx
on public.users_debug_logs (telegram_id, created_at desc);

alter table public.users_debug_logs enable row level security;

drop policy if exists "Mini App can create user debug logs"
on public.users_debug_logs;

create policy "Mini App can create user debug logs"
on public.users_debug_logs
for insert
to anon, authenticated
with check (true);

grant insert on table public.users_debug_logs to anon, authenticated;
grant usage, select on sequence public.users_debug_logs_id_seq to anon, authenticated;
