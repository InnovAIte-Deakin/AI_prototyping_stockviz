-- Global admin-controlled provider preferences.
-- Server-side code reads these rows through the Supabase service role.

create table public.provider_preferences (
  capability text primary key,
  provider text not null,
  fallback_enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint provider_preferences_capability_check check (
    capability in (
      'stock_ohlcv',
      'stock_price_series',
      'fundamentals',
      'symbol_search',
      'sentiment_news'
    )
  ),
  constraint provider_preferences_provider_check check (
    provider in (
      'yahooFinance',
      'twelveData',
      'polygon',
      'alphaVantage',
      'fmp',
      'finnhub'
    )
  )
);

comment on table public.provider_preferences is
  'Global admin provider choices. The selected provider is tried first and existing fallbacks remain enabled.';

comment on column public.provider_preferences.capability is
  'Market-data capability controlled by the admin provider selector.';

comment on column public.provider_preferences.provider is
  'Preferred provider id for the capability.';

comment on column public.provider_preferences.fallback_enabled is
  'When true, runtime falls through to remaining supported providers after the preferred provider fails.';

insert into public.provider_preferences
  (capability, provider, fallback_enabled)
values
  ('stock_ohlcv', 'yahooFinance', true),
  ('stock_price_series', 'yahooFinance', true),
  ('fundamentals', 'alphaVantage', true),
  ('symbol_search', 'yahooFinance', true),
  ('sentiment_news', 'alphaVantage', true)
on conflict (capability) do update set
  provider = excluded.provider,
  fallback_enabled = excluded.fallback_enabled,
  updated_at = now();

alter table public.provider_preferences enable row level security;

create policy "Service role only - provider preferences read"
  on public.provider_preferences for select
  using (auth.role() = 'service_role');

create policy "Service role only - provider preferences write"
  on public.provider_preferences for insert
  with check (auth.role() = 'service_role');

create policy "Service role only - provider preferences update"
  on public.provider_preferences for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
