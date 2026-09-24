-- Adiciona preço médio aos presentes (rode no SQL Editor se a tabela já existir).
alter table public.gifts
  add column if not exists avg_price numeric(10, 2);
