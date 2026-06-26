-- =====================================================
-- JUVAY WALLET SYSTEM — Migration 51
-- App 2: TTD Wallet + Credits + Transactions
-- =====================================================

-- Core wallet per user
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ttd_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  usd_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  credits INTEGER NOT NULL DEFAULT 0,
  island TEXT DEFAULT 'tt',
  currency TEXT DEFAULT 'TTD',
  is_frozen BOOLEAN DEFAULT FALSE,
  lifetime_earned DECIMAL(12,2) DEFAULT 0.00,
  lifetime_spent DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wallet" ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- Full transaction ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'topup','purchase','refund','payout_request',
    'referral_bonus','loyalty_reward','order_payment',
    'platform_credit','fx_conversion','transfer_in','transfer_out'
  )),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'TTD',
  credits_delta INTEGER DEFAULT 0,
  balance_before DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_txn_user ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_txn_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_txn_type ON public.wallet_transactions(type);
CREATE INDEX idx_wallet_txn_created ON public.wallet_transactions(created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages transactions" ON public.wallet_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Payout requests (merchant withdrawal to bank)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ttd DECIMAL(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch TEXT,
  reference_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','rejected')),
  admin_notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payouts" ON public.payout_requests
  FOR ALL USING (auth.uid() = user_id);

-- FX rates (admin-managed)
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  spread_pct DECIMAL(5,4) DEFAULT 0.04,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

INSERT INTO public.fx_rates (from_currency, to_currency, rate, spread_pct) VALUES
  ('TTD', 'USD', 0.1471, 0.04),
  ('USD', 'TTD', 6.80, 0.04),
  ('JMD', 'USD', 0.0064, 0.04),
  ('BBD', 'USD', 0.5000, 0.04)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Auto-create wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, island, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'island', 'tt'),
    CASE COALESCE(NEW.raw_user_meta_data->>'island', 'tt')
      WHEN 'jm' THEN 'JMD'
      WHEN 'bb' THEN 'BBD'
      WHEN 'gy' THEN 'GYD'
      ELSE 'TTD'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_wallet ON auth.users;
CREATE TRIGGER on_auth_user_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Safe credit function (prevents negative balance)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_currency TEXT DEFAULT 'TTD',
  p_type TEXT DEFAULT 'topup',
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet public.wallets;
  v_new_balance DECIMAL;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id) VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
  END IF;

  v_new_balance := v_wallet.ttd_balance + p_amount;

  UPDATE public.wallets SET
    ttd_balance = v_new_balance,
    lifetime_earned = lifetime_earned + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions
    (wallet_id, user_id, type, amount, currency, balance_before, balance_after, description, reference_id, status)
  VALUES
    (v_wallet.id, p_user_id, p_type, p_amount, p_currency, v_wallet.ttd_balance, v_new_balance, p_description, p_reference_id, 'completed');

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- Safe debit function (checks sufficient balance)
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_currency TEXT DEFAULT 'TTD',
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_wallet public.wallets;
  v_new_balance DECIMAL;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF v_wallet.ttd_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'balance', v_wallet.ttd_balance);
  END IF;

  v_new_balance := v_wallet.ttd_balance - p_amount;

  UPDATE public.wallets SET
    ttd_balance = v_new_balance,
    lifetime_spent = lifetime_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.wallet_transactions
    (wallet_id, user_id, type, amount, currency, balance_before, balance_after, description, reference_id, status)
  VALUES
    (v_wallet.id, p_user_id, p_type, p_amount, p_currency, v_wallet.ttd_balance, v_new_balance, p_description, p_reference_id, 'completed');

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
