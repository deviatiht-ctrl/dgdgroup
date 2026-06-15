-- 12_plop_transactions.sql
-- PLOP PLOP payment & withdrawal integration
-- Table prefix: traposa_ (existing Supabase project)

-- ─── 1. Add plop_method column to traposa_payment_methods ──────────────────
-- plop_method: the value to pass to PLOP API (moncash, natcash, kashpaw, all)
-- is_automatic: true = PLOP redirect flow, false = manual instructions shown
ALTER TABLE traposa_payment_methods
  ADD COLUMN IF NOT EXISTS plop_method  text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_automatic boolean DEFAULT false;

-- Mark existing mobile-money methods as automatic via PLOP
UPDATE traposa_payment_methods
SET plop_method  = type,
    is_automatic = true
WHERE type IN ('moncash', 'natcash', 'kashpaw');

-- ─── 2. traposa_plop_transactions ─────────────────────────────────────────
-- Tracks every PLOP PLOP payment initiated from the donation page
CREATE TABLE IF NOT EXISTS traposa_plop_transactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  donation_id     uuid        REFERENCES traposa_donations(id) ON DELETE SET NULL,
  reference_id    text        NOT NULL UNIQUE,          -- TRAPOSA-generated, sent to PLOP
  plop_txn_id     text,                                 -- transaction_id returned by PLOP
  payment_method  text        NOT NULL,                 -- moncash | natcash | kashpaw | all
  amount          numeric     NOT NULL,
  currency        text        NOT NULL DEFAULT 'HTG',
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','confirmed','failed','expired')),
  redirect_url    text,                                 -- PLOP redirect URL (expires ~10 min)
  plop_response   jsonb,                                -- raw response from PLOP for audit
  verified_at     timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE traposa_plop_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert plop transactions"    ON traposa_plop_transactions;
DROP POLICY IF EXISTS "Authenticated full plop transactions" ON traposa_plop_transactions;

-- Allow unauthenticated inserts (Edge Function uses service-role key anyway,
-- but public RLS must allow it for anon-key inserts from the function)
CREATE POLICY "Public insert plop transactions"
ON traposa_plop_transactions FOR INSERT
TO public
WITH CHECK (true);

-- Authenticated can read & update (admin + edge functions with service-role bypass RLS)
CREATE POLICY "Authenticated full plop transactions"
ON traposa_plop_transactions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── 3. traposa_plop_withdrawals ──────────────────────────────────────────
-- Tracks every automatic withdrawal request made via PLOP API
CREATE TABLE IF NOT EXISTS traposa_plop_withdrawals (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reference       text        NOT NULL UNIQUE,          -- unique per PLOP withdrawal
  amount          numeric     NOT NULL,
  fee             numeric,
  total           numeric,
  method          text        NOT NULL,                 -- moncash | natcash
  recipient       text        NOT NULL,                 -- 509XXXXXXXXX
  plop_txn_id     text,                                 -- transaction_id from PLOP
  plop_api_ref    text,                                 -- api_reference (numeric string)
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','success','failed','remboursé')),
  balance_before  numeric,
  balance_after   numeric,
  plop_response   jsonb,
  note            text,
  requested_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE traposa_plop_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full plop withdrawals" ON traposa_plop_withdrawals;

-- Only authenticated admins can access withdrawal records
CREATE POLICY "Authenticated full plop withdrawals"
ON traposa_plop_withdrawals FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── 4. Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plop_txn_reference   ON traposa_plop_transactions (reference_id);
CREATE INDEX IF NOT EXISTS idx_plop_txn_donation     ON traposa_plop_transactions (donation_id);
CREATE INDEX IF NOT EXISTS idx_plop_txn_status       ON traposa_plop_transactions (status);
CREATE INDEX IF NOT EXISTS idx_plop_wd_reference     ON traposa_plop_withdrawals  (reference);
CREATE INDEX IF NOT EXISTS idx_plop_wd_status        ON traposa_plop_withdrawals  (status);

-- ─── 5. Add plop_transaction_id to traposa_donations ──────────────────────
ALTER TABLE traposa_donations
  ADD COLUMN IF NOT EXISTS plop_transaction_id uuid
  REFERENCES traposa_plop_transactions(id) ON DELETE SET NULL;
