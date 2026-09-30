-- Imagem de referência opcional para itens da lista.
alter table public.gifts
  add column if not exists image_url text;
