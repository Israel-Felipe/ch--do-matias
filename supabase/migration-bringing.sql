-- Adiciona campos de contribuição (salgado/doce/bebida) nas RSVPs.
alter table public.rsvps
  add column if not exists bringing boolean not null default false,
  add column if not exists bringing_what text;
