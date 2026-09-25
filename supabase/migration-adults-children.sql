-- Separa adultos e crianças nas RSVPs.
-- guests continua existindo como total (adultos + crianças).

alter table public.rsvps
  add column if not exists adults integer,
  add column if not exists children integer;

update public.rsvps
set
  adults = coalesce(adults, guests, 1),
  children = coalesce(children, 0)
where adults is null or children is null;

alter table public.rsvps
  alter column adults set default 1,
  alter column children set default 0;

alter table public.rsvps
  alter column adults set not null,
  alter column children set not null;

-- Relaxa o check antigo de guests (>= 1) para permitir total 0 em "não vou".
alter table public.rsvps drop constraint if exists rsvps_guests_check;
alter table public.rsvps
  add constraint rsvps_guests_check check (guests >= 0 and guests <= 40);

alter table public.rsvps drop constraint if exists rsvps_adults_check;
alter table public.rsvps
  add constraint rsvps_adults_check check (adults >= 0 and adults <= 20);

alter table public.rsvps drop constraint if exists rsvps_children_check;
alter table public.rsvps
  add constraint rsvps_children_check check (children >= 0 and children <= 20);
