-- =============================================================================
-- StockViz Local Seed Data
-- =============================================================================
-- This seed is intentionally small and deterministic so `supabase db reset`
-- can rebuild a ready-to-use local environment for migration verification.
--
-- Seeded local accounts:
--   demo@stockviz.local    / StockVizDemo123!
--   analyst@stockviz.local / StockVizAnalyst123!
-- =============================================================================

with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'demo@stockviz.local'::text,
        'StockVizDemo123!'::text,
        'StockViz Demo'::text,
        'https://example.com/avatars/demo.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '6M',
          'currency',
          'AUD',
          'riskProfile',
          'growth',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            45,
            'technical',
            35,
            'sentiment',
            20
          )
        )
      ),
      (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'analyst@stockviz.local'::text,
        'StockVizAnalyst123!'::text,
        'Market Analyst'::text,
        'https://example.com/avatars/analyst.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '1M',
          'currency',
          'USD',
          'riskProfile',
          'balanced',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            40,
            'technical',
            35,
            'sentiment',
            25
          )
        )
      )
  ) as users(id, email, password, full_name, avatar_url, preferences)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_change,
  phone_change_token,
  email_change_token_current,
  email_change_confirm_status,
  reauthentication_token,
  is_sso_user
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt(password, extensions.gen_salt('bf')),
  timezone('utc', now()),
  '',
  '',
  '',
  '',
  timezone('utc', now()),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  jsonb_build_object('full_name', full_name, 'avatar_url', avatar_url),
  false,
  timezone('utc', now()),
  timezone('utc', now()),
  null,
  '',
  '',
  '',
  0,
  '',
  false
from seed_users
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  last_sign_in_at = excluded.last_sign_in_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'demo@stockviz.local'::text,
        'StockViz Demo'::text,
        'https://example.com/avatars/demo.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '6M',
          'currency',
          'AUD',
          'riskProfile',
          'growth',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            45,
            'technical',
            35,
            'sentiment',
            20
          )
        )
      ),
      (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'analyst@stockviz.local'::text,
        'Market Analyst'::text,
        'https://example.com/avatars/analyst.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '1M',
          'currency',
          'USD',
          'riskProfile',
          'balanced',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            40,
            'technical',
            35,
            'sentiment',
            25
          )
        )
      )
  ) as users(id, email, full_name, avatar_url, preferences)
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  jsonb_build_object(
    'sub',
    id::text,
    'email',
    email,
    'email_verified',
    true,
    'phone_verified',
    false
  ),
  'email',
  id::text,
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
from seed_users
on conflict (id) do update
set
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = excluded.updated_at;

with seed_profiles as (
  select *
  from (
    values
      (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'StockViz Demo'::text,
        'https://example.com/avatars/demo.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '6M',
          'currency',
          'AUD',
          'riskProfile',
          'growth',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            45,
            'technical',
            35,
            'sentiment',
            20
          )
        )
      ),
      (
        '22222222-2222-2222-2222-222222222222'::uuid,
        'Market Analyst'::text,
        'https://example.com/avatars/analyst.png'::text,
        jsonb_build_object(
          'defaultTimeframe',
          '1M',
          'currency',
          'USD',
          'riskProfile',
          'balanced',
          'defaultWeights',
          jsonb_build_object(
            'fundamental',
            40,
            'technical',
            35,
            'sentiment',
            25
          )
        )
      )
  ) as profiles(id, full_name, avatar_url, preferences)
)
insert into public.profiles (id, full_name, avatar_url, preferences)
select id, full_name, avatar_url, preferences
from seed_profiles
on conflict (id) do update
set
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  preferences = excluded.preferences,
  updated_at = timezone('utc', now());

insert into public.stocks (id, symbol, exchange_mic, name, last_price)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    'AAPL',
    'XNAS',
    'Apple Inc.',
    212.34
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
    'MSFT',
    'XNAS',
    'Microsoft Corporation',
    428.11
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid,
    'NVDA',
    'XNAS',
    'NVIDIA Corporation',
    118.72
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid,
    'CBA',
    'XASX',
    'Commonwealth Bank of Australia',
    153.45
  )
on conflict (id) do update
set
  symbol = excluded.symbol,
  exchange_mic = excluded.exchange_mic,
  name = excluded.name,
  last_price = excluded.last_price,
  updated_at = timezone('utc', now());

insert into public.wishlist (id, user_id, stock_id, notes)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid,
    'Watch AI momentum and valuation compression together.'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid,
    'Australian banking exposure for longer-term diversification.'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    'Track upcoming earnings and services revenue mix.'
  )
on conflict (user_id, stock_id) do update
set notes = excluded.notes;

insert into public.portfolio_holdings (
  id,
  user_id,
  symbol,
  shares,
  avg_price,
  acquired_at,
  notes
)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'AAPL',
    12,
    187.50,
    '2025-03-10',
    'Core long-term holding.'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'MSFT',
    5,
    401.20,
    '2025-01-22',
    'Cloud and enterprise exposure.'
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'NVDA',
    8,
    96.10,
    '2024-11-05',
    'Higher-volatility growth position.'
  )
on conflict (user_id, symbol) do update
set
  shares = excluded.shares,
  avg_price = excluded.avg_price,
  acquired_at = excluded.acquired_at,
  notes = excluded.notes,
  updated_at = timezone('utc', now());

insert into public.analysis_cache (cache_key, data, expires_at)
values
  (
    'analysis:AAPL:6M:demo',
    jsonb_build_object(
      'symbol',
      'AAPL',
      'score',
      78,
      'recommendation',
      'Buy',
      'summary',
      'Seeded cache example for local verification.'
    ),
    timezone('utc', now()) + interval '3 days'
  ),
  (
    'analysis:MSFT:1M:expired',
    jsonb_build_object(
      'symbol',
      'MSFT',
      'score',
      71,
      'recommendation',
      'Hold',
      'summary',
      'Expired cache row for cleanup checks.'
    ),
    timezone('utc', now()) - interval '2 days'
  )
on conflict (cache_key) do update
set
  data = excluded.data,
  expires_at = excluded.expires_at;

insert into public.api_call_log (
  api_name,
  endpoint,
  symbol,
  timeframe,
  success,
  response_time,
  created_at
)
values
  (
    'finnhub',
    '/quote',
    'AAPL',
    null,
    true,
    184,
    timezone('utc', now()) - interval '4 hours'
  ),
  (
    'alphavantage',
    '/query?function=TIME_SERIES_DAILY',
    'MSFT',
    '6M',
    true,
    392,
    timezone('utc', now()) - interval '2 hours'
  ),
  (
    'gemini',
    '/summaries',
    'NVDA',
    '1M',
    false,
    1240,
    timezone('utc', now()) - interval '45 minutes'
  );
