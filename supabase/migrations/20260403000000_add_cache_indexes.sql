-- =============================================================================
-- StockViz Cache and API Tracking Indexes
-- Migration: 20260403_add_indexes
-- =============================================================================
-- Adds performance indexes for cache expiration queries and API log lookups.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Index on analysis_cache.expires_at
-- Speeds up expiration checks and cleanup queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires_at 
  ON public.analysis_cache(expires_at);

COMMENT ON INDEX public.idx_analysis_cache_expires_at 
  IS 'Speeds up cache expiration checks and cleanup operations';

-- ---------------------------------------------------------------------------
-- Index on analysis_cache.created_at
-- Useful for cache analytics and LRU eviction strategies
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_analysis_cache_created_at 
  ON public.analysis_cache(created_at);

COMMENT ON INDEX public.idx_analysis_cache_created_at 
  IS 'Useful for cache analytics and LRU eviction strategies';

-- ---------------------------------------------------------------------------
-- Index on api_call_log.created_at DESC
-- Speeds up recent calls queries and cleanup operations
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_api_call_log_created_at_desc 
  ON public.api_call_log(created_at DESC);

COMMENT ON INDEX public.idx_api_call_log_created_at_desc 
  IS 'Speeds up recent API call queries and cleanup operations';

-- ---------------------------------------------------------------------------
-- Index on api_call_log.api_name
-- Speeds up per-API statistics aggregation
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_api_call_log_api_name 
  ON public.api_call_log(api_name);

COMMENT ON INDEX public.idx_api_call_log_api_name 
  IS 'Speeds up per-API statistics aggregation queries';

-- ---------------------------------------------------------------------------
-- Composite index for api_name + created_at
-- Optimizes time-range queries for specific APIs
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_api_call_log_api_name_created_at 
  ON public.api_call_log(api_name, created_at DESC);

COMMENT ON INDEX public.idx_api_call_log_api_name_created_at 
  IS 'Optimizes time-range queries filtered by API name';

-- ---------------------------------------------------------------------------
-- Optional: RPC function for efficient API stats aggregation
-- This avoids fetching all records into application memory
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_api_stats()
RETURNS TABLE (
  api_name text,
  total_calls bigint,
  successful_calls bigint,
  failed_calls bigint,
  avg_response_time double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    api_name,
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE success = true) AS successful_calls,
    COUNT(*) FILTER (WHERE success = false) AS failed_calls,
    AVG(response_time) AS avg_response_time
  FROM public.api_call_log
  GROUP BY api_name;
$$;

COMMENT ON FUNCTION public.get_api_stats() 
  IS 'Returns aggregated statistics per API name without loading all records';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_api_stats() TO authenticated;
