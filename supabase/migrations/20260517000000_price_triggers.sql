-- Migration: Price Triggers
-- Description: Create price_triggers table for alerts, auto-buys, and auto-sells.

CREATE TYPE trigger_type AS ENUM ('notify', 'buy', 'sell');
CREATE TYPE trigger_status AS ENUM ('active', 'fired', 'cancelled');

CREATE TABLE IF NOT EXISTS public.price_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    trigger_price NUMERIC NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    type trigger_type NOT NULL,
    shares INTEGER, -- Only required for buy/sell
    status trigger_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fired_at TIMESTAMPTZ,
    
    -- Constraint: Buy/Sell must have shares
    CONSTRAINT buy_sell_shares_check CHECK (
        (type = 'notify') OR (shares IS NOT NULL AND shares > 0)
    )
);

-- Enable RLS
ALTER TABLE public.price_triggers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own triggers"
    ON public.price_triggers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own triggers"
    ON public.price_triggers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own triggers"
    ON public.price_triggers FOR UPDATE
    USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_price_triggers_user_id ON public.price_triggers(user_id);
CREATE INDEX idx_price_triggers_status ON public.price_triggers(status) WHERE status = 'active';
CREATE INDEX idx_price_triggers_symbol ON public.price_triggers(symbol);
