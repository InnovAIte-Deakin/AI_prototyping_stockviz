-- =============================================================================
-- StockViz Initial Schema
-- Migration: 20260329_initial_schema
-- =============================================================================
-- Creates core tables for user profiles, stock catalog, wishlist,
-- portfolio, analysis caching, and API call tracking.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles — extends auth.users with app-specific data
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  preferences jsonb default '{}'::jsonb,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

comment on table public.profiles is 'App-specific user profile data extending Supabase auth.users';
comment on column public.profiles.preferences is 'JSON blob for user preferences: theme, defaultTimeframe, defaultWeights, currency, etc.';

-- Auto-create profile on user signup via trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 2. stocks — canonical instruments (lazy-filled when users wishlist)
-- ---------------------------------------------------------------------------
create table public.stocks (
  id           uuid primary key default gen_random_uuid(),
  symbol       text not null,
  exchange_mic text,
  name         text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,

  constraint stocks_symbol_nonempty check (length(trim(symbol)) > 0)
);

comment on table public.stocks is 'Canonical stock/instrument rows; exchange_mic disambiguates same ticker on different venues';

create unique index stocks_instrument_unique
  on public.stocks (upper(trim(symbol)), coalesce(exchange_mic, ''));

create trigger stocks_updated_at
  before update on public.stocks
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 3. wishlist — user's saved stocks (FK to stocks)
-- ---------------------------------------------------------------------------
create table public.wishlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  stock_id   uuid not null references public.stocks(id) on delete cascade,
  notes      text,
  created_at timestamptz default now() not null,

  unique (user_id, stock_id)
);

comment on table public.wishlist is 'User wishlist — one row per user per stock';

create index idx_wishlist_user on public.wishlist(user_id);

-- ---------------------------------------------------------------------------
-- 4. portfolio_holdings — user's stock positions
-- ---------------------------------------------------------------------------
create table public.portfolio_holdings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  symbol      text not null,
  shares      numeric not null check (shares > 0),
  avg_price   numeric not null check (avg_price >= 0),
  acquired_at date,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,

  unique (user_id, symbol)
);

comment on table public.portfolio_holdings is 'User stock positions — single lot per symbol (aggregated)';

create index idx_holdings_user on public.portfolio_holdings(user_id);

create trigger holdings_updated_at
  before update on public.portfolio_holdings
  for each row execute function public.update_updated_at();

-- ---------------------------------------------------------------------------
-- 5. analysis_cache — server-side cache (replaces in-memory CacheService)
-- ---------------------------------------------------------------------------
create table public.analysis_cache (
  cache_key   text primary key,
  data        jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now() not null
);

comment on table public.analysis_cache is 'Server-side analysis result cache replacing legacy in-memory Map()';

create index idx_cache_expires on public.analysis_cache(expires_at);

-- ---------------------------------------------------------------------------
-- 6. api_call_log — API usage tracking (replaces in-memory APITrackingService)
-- ---------------------------------------------------------------------------
create table public.api_call_log (
  id             bigint generated always as identity primary key,
  api_name       text not null,
  endpoint       text not null,
  symbol         text,
  timeframe      text,
  success        boolean default true,
  response_time  integer,
  created_at     timestamptz default now() not null
);

comment on table public.api_call_log is 'External API call tracking for admin monitoring and rate-limit awareness';

create index idx_api_log_name_created on public.api_call_log(api_name, created_at desc);
create index idx_api_log_created on public.api_call_log(created_at desc);

-- =============================================================================
-- Row-Level Security (RLS) Policies
-- =============================================================================

-- profiles: users can only read/update their own
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Note: INSERT is handled by the trigger, not directly by users

-- stocks: catalog readable/writable by authenticated users (lazy upsert from app)
alter table public.stocks enable row level security;

create policy "Authenticated users can read stocks"
  on public.stocks for select
  using (auth.uid() is not null);

create policy "Authenticated users can insert stocks"
  on public.stocks for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update stocks"
  on public.stocks for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- wishlist: users can CRUD their own rows
alter table public.wishlist enable row level security;

create policy "Users can view own wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Users can add to own wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wishlist items"
  on public.wishlist for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete from own wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id);

-- portfolio_holdings: users can CRUD their own
alter table public.portfolio_holdings enable row level security;

create policy "Users can view own holdings"
  on public.portfolio_holdings for select
  using (auth.uid() = user_id);

create policy "Users can add holdings"
  on public.portfolio_holdings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on public.portfolio_holdings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own holdings"
  on public.portfolio_holdings for delete
  using (auth.uid() = user_id);

-- analysis_cache: service-only (no public access via PostgREST)
-- Accessed via service_role key from server-side code only
alter table public.analysis_cache enable row level security;

create policy "Service role only — cache read"
  on public.analysis_cache for select
  using (auth.role() = 'service_role');

create policy "Service role only — cache write"
  on public.analysis_cache for insert
  with check (auth.role() = 'service_role');

create policy "Service role only — cache update"
  on public.analysis_cache for update
  using (auth.role() = 'service_role');

create policy "Service role only — cache delete"
  on public.analysis_cache for delete
  using (auth.role() = 'service_role');

-- api_call_log: service-only (no public access)
alter table public.api_call_log enable row level security;

create policy "Service role only — log read"
  on public.api_call_log for select
  using (auth.role() = 'service_role');

create policy "Service role only — log write"
  on public.api_call_log for insert
  with check (auth.role() = 'service_role');
