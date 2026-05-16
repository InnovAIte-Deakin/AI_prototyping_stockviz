-- PostgREST often does not set current_setting('request.jwt.claim.role') for RPC calls.
-- Use auth.role() so paper_buy/paper_sell accept the service_role JWT from the JS client.

create or replace function public.profiles_paper_cash_guard()
returns trigger
language plpgsql
as $$
begin
  if new.paper_cash_usd is distinct from old.paper_cash_usd then
    if (select auth.role()) is distinct from 'service_role' then
      raise exception 'paper_cash_usd cannot be updated directly' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.paper_buy(
  p_user_id uuid,
  p_symbol text,
  p_shares numeric,
  p_unit_price_usd numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sym text := upper(trim(p_symbol));
  v_cost numeric(20, 4);
  v_cash numeric(20, 4);
  v_old_shares numeric(20, 8);
  v_old_avg numeric(20, 4);
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_sym is null or length(v_sym) = 0 or length(v_sym) > 32 or v_sym !~ '^[A-Z0-9.:^-]+$' then
    raise exception 'invalid_symbol' using errcode = '22023';
  end if;

  if p_shares is null or p_shares <= 0 or p_shares > 1e12 then
    raise exception 'invalid_shares' using errcode = '22023';
  end if;

  if p_unit_price_usd is null or p_unit_price_usd <= 0 then
    raise exception 'invalid_price' using errcode = '22023';
  end if;

  v_cost := round(p_shares * p_unit_price_usd, 4);

  select paper_cash_usd into v_cash
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  if v_cash < v_cost then
    raise exception 'insufficient_cash' using errcode = 'P0001';
  end if;

  update public.profiles
  set paper_cash_usd = paper_cash_usd - v_cost
  where id = p_user_id;

  insert into public.portfolio_transactions (
    user_id, symbol, side, shares, unit_price_usd, total_cash_delta_usd, realized_pl_usd
  ) values (
    p_user_id, v_sym, 'buy', p_shares, p_unit_price_usd, -v_cost, null
  );

  select shares, avg_price into v_old_shares, v_old_avg
  from public.portfolio_holdings
  where user_id = p_user_id and symbol = v_sym
  for update;

  if not found then
    insert into public.portfolio_holdings (user_id, symbol, shares, avg_price, acquired_at)
    values (p_user_id, v_sym, p_shares, p_unit_price_usd, (current_date));
  else
    update public.portfolio_holdings
    set
      shares = v_old_shares + p_shares,
      avg_price = round(
        (v_old_shares * v_old_avg + p_shares * p_unit_price_usd) / (v_old_shares + p_shares),
        4
      ),
      updated_at = now()
    where user_id = p_user_id and symbol = v_sym;
  end if;
end;
$$;

create or replace function public.paper_sell(
  p_user_id uuid,
  p_symbol text,
  p_shares numeric,
  p_unit_price_usd numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sym text := upper(trim(p_symbol));
  v_proceeds numeric(20, 4);
  v_realized numeric(20, 4);
  v_holding_shares numeric(20, 8);
  v_hold_avg numeric(20, 4);
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_sym is null or length(v_sym) = 0 or length(v_sym) > 32 or v_sym !~ '^[A-Z0-9.:^-]+$' then
    raise exception 'invalid_symbol' using errcode = '22023';
  end if;

  if p_shares is null or p_shares <= 0 or p_shares > 1e12 then
    raise exception 'invalid_shares' using errcode = '22023';
  end if;

  if p_unit_price_usd is null or p_unit_price_usd < 0 then
    raise exception 'invalid_price' using errcode = '22023';
  end if;

  perform 1
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  select shares, avg_price into v_holding_shares, v_hold_avg
  from public.portfolio_holdings
  where user_id = p_user_id and symbol = v_sym
  for update;

  if not found then
    raise exception 'no_position' using errcode = 'P0002';
  end if;

  if v_holding_shares < p_shares then
    raise exception 'insufficient_shares' using errcode = 'P0001';
  end if;

  v_proceeds := round(p_shares * p_unit_price_usd, 4);
  v_realized := round((p_unit_price_usd - v_hold_avg) * p_shares, 4);

  update public.profiles
  set paper_cash_usd = paper_cash_usd + v_proceeds
  where id = p_user_id;

  insert into public.portfolio_transactions (
    user_id, symbol, side, shares, unit_price_usd, total_cash_delta_usd, realized_pl_usd
  ) values (
    p_user_id, v_sym, 'sell', p_shares, p_unit_price_usd, v_proceeds, v_realized
  );

  if v_holding_shares = p_shares then
    delete from public.portfolio_holdings
    where user_id = p_user_id and symbol = v_sym;
  else
    update public.portfolio_holdings
    set shares = v_holding_shares - p_shares, updated_at = now()
    where user_id = p_user_id and symbol = v_sym;
  end if;
end;
$$;
