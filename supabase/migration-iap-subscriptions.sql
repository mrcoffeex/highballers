-- In-app purchase receipts and server-side subscription tier protection

create table if not exists public.subscription_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  transaction_id text not null,
  purchase_token text,
  platform text not null check (platform in ('ios', 'android', 'unknown')),
  transaction_date timestamptz not null default now(),
  restored boolean not null default false,
  created_at timestamptz not null default now(),
  unique (platform, transaction_id)
);

create index if not exists subscription_receipts_user_id_idx
  on public.subscription_receipts (user_id);

alter table public.subscription_receipts enable row level security;

create policy "Users can read own subscription receipts"
  on public.subscription_receipts for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Prevent clients from self-upgrading subscription_tier; only service role may change it.
create or replace function public.protect_subscription_tier()
returns trigger
language plpgsql
as $$
begin
  if old.subscription_tier is distinct from new.subscription_tier then
    if current_user in ('service_role', 'postgres', 'supabase_admin') then
      return new;
    end if;
    new.subscription_tier := old.subscription_tier;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_subscription_tier on public.profiles;
create trigger protect_profiles_subscription_tier
  before update on public.profiles
  for each row
  execute function public.protect_subscription_tier();
