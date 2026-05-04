-- Last quoted price cached on the canonical stock row (optional; filled by app/API sync)
alter table public.stocks
  add column last_price numeric
  check (last_price is null or last_price >= 0);

comment on column public.stocks.last_price is 'Most recently fetched trade/quote price for this instrument';
