create extension if not exists pgcrypto;

create table if not exists feature_flags (
  key text primary key,
  value_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists merchant_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists billing_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_type text not null check (order_type in ('subscription','credit_pack')),
  plan_code text,
  pack_code text,
  amount_krw integer not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','failed')),
  provider text not null default 'manual',
  provider_ref text,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists credit_wallets (
  user_id uuid primary key,
  monthly_plan_code text not null default 'free',
  monthly_included integer not null default 0,
  monthly_used integer not null default 0,
  purchased_total integer not null default 0,
  purchased_used integer not null default 0,
  cycle_start date,
  cycle_end date,
  updated_at timestamptz not null default now()
);

create table if not exists credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid references billing_orders(id) on delete set null,
  delta integer not null,
  kind text not null check (kind in ('purchase','consume','adjust')),
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_orders_user_id on billing_orders(user_id);
create index if not exists idx_billing_orders_status on billing_orders(status);
create index if not exists idx_merchant_products_user_id on merchant_products(user_id);
create index if not exists idx_credit_ledger_user_id on credit_ledger(user_id);

insert into feature_flags (key, value_json)
values ('billing_enabled', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
