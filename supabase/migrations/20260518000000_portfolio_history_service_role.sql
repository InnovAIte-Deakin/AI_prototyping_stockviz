-- Allow service_role to call record_portfolio_snapshot RPC (parity with paper_buy/paper_sell)
grant execute on function public.record_portfolio_snapshot(uuid, numeric, numeric, numeric) to service_role;
