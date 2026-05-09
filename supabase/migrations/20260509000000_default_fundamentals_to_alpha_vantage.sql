-- Yahoo Finance quoteSummary now rejects unauthenticated server requests with
-- "Invalid Crumb". Prefer Alpha Vantage for fundamentals when the row still has
-- the original Yahoo default, while preserving any explicit admin choice.

update public.provider_preferences
set
  provider = 'alphaVantage',
  updated_at = now()
where capability = 'fundamentals'
  and provider = 'yahooFinance'
  and updated_by is null;
