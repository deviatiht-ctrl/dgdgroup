-- 13_fix_donations_grants.sql
-- Fix COMPLET pou traposa_donations:
--   1. GRANT eksplisit pou anon role (kòz reyèl 401/42501)
--   2. Retire CHECK constraint restrictif sou payment_method
--   3. Ajoute kolonn mankan: updated_at, stripe_payment_intent_id, plop_transaction_id
--   4. Drop + rekreye tout policies RLS pwòpman
-- Kouri sa yon sèl fwa nan Supabase SQL Editor.

-- ─── 1. GRANT — root cause reyèl la ──────────────────────────────────────
-- Tablo ki kreye via SQL (pa Dashboard) pa jwenn GRANT otomatik pou anon.
-- San GRANT, RLS policy pa ka ede — PostgreSQL bloke anvan li rive nan policy.
GRANT SELECT, INSERT
  ON TABLE traposa_donations TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE traposa_donations TO authenticated;

-- ─── 2. Retire CHECK constraint sou payment_method ────────────────────────
-- Orijinal: CHECK (payment_method IN ('moncash','natcash','stripe','paypal','bank_transfer'))
-- Prob: 'kashpaw', 'all', ak lòt PLOP metòd yo pa nan lis la.
ALTER TABLE traposa_donations
  DROP CONSTRAINT IF EXISTS traposa_donations_payment_method_check;

-- ─── 3. Ajoute kolonn mankan ──────────────────────────────────────────────
ALTER TABLE traposa_donations
  ADD COLUMN IF NOT EXISTS updated_at                timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS plop_transaction_id       uuid;

-- Trigger pou updated_at (si li pa egziste deja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_traposa_donations_updated_at'
  ) THEN
    CREATE TRIGGER trg_traposa_donations_updated_at
    BEFORE UPDATE ON traposa_donations
    FOR EACH ROW EXECUTE FUNCTION traposa_update_updated_at();
  END IF;
END $$;

-- ─── 4. RLS — aktive + netwaye tout vye policies ─────────────────────────
ALTER TABLE traposa_donations ENABLE ROW LEVEL SECURITY;

-- Drop tout policies ki ka egziste (nenpòt non)
DROP POLICY IF EXISTS "traposa_donations_own"              ON traposa_donations;
DROP POLICY IF EXISTS "traposa_donations_insert"           ON traposa_donations;
DROP POLICY IF EXISTS "traposa_donations_admin_update"     ON traposa_donations;
DROP POLICY IF EXISTS "Allow insert donations public"      ON traposa_donations;
DROP POLICY IF EXISTS "Allow select donations authenticated" ON traposa_donations;
DROP POLICY IF EXISTS "Allow update donations authenticated" ON traposa_donations;
DROP POLICY IF EXISTS "traposa_donations_select"           ON traposa_donations;
DROP POLICY IF EXISTS "traposa_donations_update"           ON traposa_donations;

-- ─── 5. Rekreye policies pwòpman ──────────────────────────────────────────

-- ANON + AUTHENTICATED ka fe don (INSERT lib)
CREATE POLICY "traposa_donations_insert"
ON traposa_donations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Yon itilizatè konekte wè sèlman pwòp don li
-- Admin wè tout don yo
CREATE POLICY "traposa_donations_select"
ON traposa_donations FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR is_traposa_admin()
);

-- Sèlman admin ka modifye (konfime, anile, etc.)
CREATE POLICY "traposa_donations_update"
ON traposa_donations FOR UPDATE
TO authenticated
USING (is_traposa_admin())
WITH CHECK (true);

-- Sèlman admin ka siprime
CREATE POLICY "traposa_donations_delete"
ON traposa_donations FOR DELETE
TO authenticated
USING (is_traposa_admin());
