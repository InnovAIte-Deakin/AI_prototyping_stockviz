-- =============================================================================
-- StockViz Initial Schema
-- Migration: 20260329_initial_schema
-- =============================================================================
-- Creates core tables for user profiles, portfolio, watchlist,
-- analysis caching, and API call tracking.
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
-- 2. watchlist_items — user's saved stock symbols
-- ---------------------------------------------------------------------------
create table public.watchlist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  name       text,
  notes      text,
  created_at timestamptz default now() not null,

  unique (user_id, symbol)
);

comment on table public.watchlist_items is 'User watchlist — one entry per symbol per user';

create index idx_watchlist_user on public.watchlist_items(user_id);

-- ---------------------------------------------------------------------------
-- 3. portfolio_holdings — user's stock positions
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
-- 4. analysis_cache — server-side cache (replaces in-memory CacheService)
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
-- 5. api_call_log — API usage tracking (replaces in-memory APITrackingService)
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

-- watchlist_items: users can CRUD their own
alter table public.watchlist_items enable row level security;

create policy "Users can view own watchlist"
  on public.watchlist_items for select
  using (auth.uid() = user_id);

create policy "Users can add to own watchlist"
  on public.watchlist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watchlist items"
  on public.watchlist_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete from own watchlist"
  on public.watchlist_items for delete
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
