# Chá do Matias

Site do chá de bebê do Matias: página bonita (tema dos gansos) com lista de sugestões em que cada convidado reserva um item com o nome.

Feito para **celular primeiro** — a maioria dos convidados vai abrir pelo WhatsApp no telefone.

## Rodar localmente

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

- Página dos convidados: `/`
- Área da família (admin): `/admin`
- Senha padrão do admin: `matias2026` (troque com `ADMIN_PASSWORD` no `.env.local`)

Sem configurar Supabase, os dados ficam em `data/gifts.json` (criado automaticamente).

## Depois: GitHub, Supabase e publicar

Você **não precisa** fazer isso agora. Quando for compartilhar o link com os convidados, siga:

### 1. Criar o repositório no GitHub

No Cursor Cloud Agent, use o pill **Create repo** (se ainda não tiver repo). Depois o código já pode ir para o GitHub.

### 2. Criar projeto no Supabase (gratuito)

1. Acesse [https://supabase.com](https://supabase.com) e crie um projeto
2. Em **SQL Editor**, cole e rode o arquivo [`supabase/schema.sql`](supabase/schema.sql)
3. Em **Project Settings → API**, copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` public → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (opcional neste app)

### 3. Variáveis de ambiente

Copie [`.env.example`](.env.example) para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Com as chaves do Supabase preenchidas, o app passa a usar o banco automaticamente (sem mudar código).

### 4. Publicar (ex.: Vercel)

1. Importe o repo na [Vercel](https://vercel.com)
2. Cole as mesmas variáveis de ambiente
3. Deploy → compartilhe a URL com os convidados

Na hora de conectar, peça ajuda no chat do agent — dá para ir passo a passo.

## Lista da planilha

A lista inicial é um seed de sugestões comuns. Quando você enviar o `.xlsx` ou CSV, substituímos o seed pelos itens reais (também dá para editar tudo em `/admin`).

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Store local agora; Supabase (Postgres) quando configurar o `.env`
