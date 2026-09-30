-- Quem marcou que vai presentear via PIX (sempre disponível; vários registros).
create table if not exists public.pix_pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists pix_pledges_created_at_idx
  on public.pix_pledges (created_at desc);

alter table public.pix_pledges enable row level security;

create policy "pix_pledges_insert_public"
  on public.pix_pledges for insert
  to anon, authenticated
  with check (true);

-- Leituras ficam no servidor (service role) para a família.
