-- Table to track daily portfolio value snapshots
create table if not exists public.portfolio_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  total_value_usd numeric(20, 4) not null,
  paper_cash_usd numeric(20, 4) not null,
  holdings_value_usd numeric(20, 4) not null,
  recorded_at timestamptz not null default now()
);

-- Index for fast lookup by user and date
create index if not exists idx_portfolio_history_user_date 
  on public.portfolio_history (user_id, recorded_at desc);

-- RLS policies
alter table public.portfolio_history enable row level security;

create policy "Users can view own portfolio history"
  on public.portfolio_history for select
  using (auth.uid() = user_id);

-- Function to record a snapshot (can be called via RPC or trigger)
create or replace function public.record_portfolio_snapshot(p_user_id uuid, p_total_value numeric, p_cash numeric, p_holdings_value numeric)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.portfolio_history (user_id, total_value_usd, paper_cash_usd, holdings_value_usd)
  values (p_user_id, p_total_value, p_cash, p_holdings_value);
end;
$$;
