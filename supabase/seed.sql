-- =============================================================================
-- StockViz Seed Data
-- =============================================================================
-- Populates development data for local testing.
-- This runs after migrations during `supabase db reset`.
-- =============================================================================

-- Note: We cannot seed profiles directly because they depend on auth.users.
-- To test with seeded data:
--   1. Start the app and sign up a test user via the UI
--   2. Or use the Supabase dashboard to create a user, which auto-creates a profile via trigger
--   3. Then manually insert watchlist/holdings for that user's UUID

-- Seed some analysis cache entries for testing
insert into public.analysis_cache (cache_key, data, expires_at) values
  ('analysis:AAPL:full:1d', '{"status":"ok","symbol":"AAPL","analysis":{"mode":"full","timeframe":"1d","overall":{"score":72,"recommendation":"Buy"}}}', now() + interval '5 minutes'),
  ('analysis:MSFT:full:1d', '{"status":"ok","symbol":"MSFT","analysis":{"mode":"full","timeframe":"1d","overall":{"score":68,"recommendation":"Hold"}}}', now() + interval '5 minutes'),
  ('analysis:TSLA:full:1d', '{"status":"ok","symbol":"TSLA","analysis":{"mode":"full","timeframe":"1d","overall":{"score":45,"recommendation":"Hold"}}}', now() + interval '5 minutes')
on conflict (cache_key) do nothing;

-- Seed some API call log entries for admin dashboard testing
insert into public.api_call_log (api_name, endpoint, symbol, timeframe, success, response_time) values
  ('Alpha Vantage', 'TIME_SERIES', 'AAPL', '1d', true, 342),
  ('Alpha Vantage', 'TIME_SERIES', 'MSFT', '1d', true, 287),
  ('Twelve Data', 'TIME_SERIES', 'TSLA', '1d', true, 198),
  ('TradingView', 'SCAN', null, null, true, 456),
  ('Gemini', 'generateContent', 'AAPL', null, true, 1203),
  ('Gemini', 'generateContent', 'GOOGL', null, false, 5000),
  ('FMP', 'PROFILE', 'NVDA', null, true, 312),
  ('Yahoo Finance', 'CHART', 'AMZN', '1d', true, 267);
