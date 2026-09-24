-- Schema do Chá do Matias (Supabase)
-- Cole no SQL Editor quando for conectar o banco.

create extension if not exists "pgcrypto";

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand text,
  category text,
  notes text,
  link text,
  claimed_by text,
  claimed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gifts_sort_order_idx on public.gifts (sort_order);

alter table public.gifts enable row level security;

create policy "gifts_select_public"
  on public.gifts for select
  to anon, authenticated
  using (true);

create policy "gifts_claim_if_free"
  on public.gifts for update
  to anon, authenticated
  using (claimed_by is null)
  with check (claimed_by is not null);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  guests integer not null default 1 check (guests >= 1 and guests <= 20),
  status text not null check (status in ('yes', 'no', 'maybe')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;

create policy "rsvps_insert_public"
  on public.rsvps for insert
  to anon, authenticated
  with check (true);

-- Leituras de RSVP ficam no servidor (service role) para a família.
