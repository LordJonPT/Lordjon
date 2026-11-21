-- LORDJON: executar apenas num projeto Supabase dedicado ao site.
-- Sem compras ou atribuição automática de pontos até a autenticação ser implementada.
create extension if not exists pgcrypto;
create table if not exists public.lordjon_products (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 90),
 description text not null default '',
 category text not null check(category in ('merch','rewards')),
 status text not null default 'draft' check(status in ('draft','published')),
 image_url text,
 price_eur_cents integer check(price_eur_cents>=0),
 points_cost integer check(points_cost>=0),
 stock integer not null default 0 check(stock>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.lordjon_promotions (
 id uuid primary key default gen_random_uuid(),
 brand text not null,
 headline text not null,
 details text not null default '',
 banner_url text,
 target_url text not null,
 starts_at timestamptz,
 ends_at timestamptz,
 active boolean not null default false,
 created_at timestamptz not null default now()
);
-- Estrutura de carteira e registo preparada; não há endpoint público que credite pontos.
create table if not exists public.lordjon_wallets (
 user_id uuid primary key references auth.users(id) on delete cascade,
 balance bigint not null default 0 check(balance>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.lordjon_point_ledger (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 delta bigint not null check(delta<>0),
 reason text not null,
 source_key text unique not null,
 created_at timestamptz not null default now()
);
create table if not exists public.lordjon_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.lordjon_products(id),
 points_spent integer not null default 0 check(points_spent>=0),
 payment_cents integer not null default 0 check(payment_cents>=0),
 status text not null default 'pending' check(status in ('pending','approved','fulfilled','cancelled')),
 created_at timestamptz not null default now()
);
alter table public.lordjon_products enable row level security;
alter table public.lordjon_promotions enable row level security;
alter table public.lordjon_wallets enable row level security;
alter table public.lordjon_point_ledger enable row level security;
alter table public.lordjon_orders enable row level security;
-- Nenhum INSERT/UPDATE/DELETE permitido a utilizadores anónimos/autenticados.
-- O backend usa somente a chave secreta do servidor, nunca no navegador.
revoke all on public.lordjon_products,public.lordjon_promotions,public.lordjon_wallets,public.lordjon_point_ledger,public.lordjon_orders from anon,authenticated;
grant select on public.lordjon_products,public.lordjon_promotions to anon,authenticated;
grant select on public.lordjon_wallets,public.lordjon_point_ledger,public.lordjon_orders to authenticated;
create policy "public products" on public.lordjon_products for select to anon,authenticated using(status='published');
create policy "public active campaigns" on public.lordjon_promotions for select to anon,authenticated using(active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()));
create policy "own wallet" on public.lordjon_wallets for select to authenticated using ((select auth.uid())=user_id);
create policy "own ledger" on public.lordjon_point_ledger for select to authenticated using ((select auth.uid())=user_id);
create policy "own orders" on public.lordjon_orders for select to authenticated using ((select auth.uid())=user_id);
