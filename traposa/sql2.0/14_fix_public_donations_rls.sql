-- 14_fix_public_donations_rls.sql
-- FIX FINAL: Pèmèt moun fè don san yo pa konekte sou site la.
-- Rezon: don.js itilize insert(...).select('id'), kidonk anon bezwen INSERT + SELECT.
-- Kouri tout script sa nan Supabase SQL Editor.

-- 1. Asire schema/table privileges egziste pou API role yo
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT
ON TABLE public.traposa_donations
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.traposa_donations
TO authenticated;

-- 2. Retire constraint ki ka bloke payment_method PLOP yo
ALTER TABLE public.traposa_donations
  DROP CONSTRAINT IF EXISTS traposa_donations_payment_method_check;

-- 3. Ajoute kolòn frontend/edge functions bezwen yo
ALTER TABLE public.traposa_donations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS plop_transaction_id uuid;

-- 4. Aktive RLS
ALTER TABLE public.traposa_donations ENABLE ROW LEVEL SECURITY;

-- 5. Drop TOUT policies ki egziste sou tablo a, menm si non yo diferan
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'traposa_donations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.traposa_donations', p.policyname);
  END LOOP;
END $$;

-- 6. Policy piblik pou INSERT: nenpòt vizitè ka kreye yon don pending
CREATE POLICY "public_can_insert_donations"
ON public.traposa_donations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 7. Policy piblik pou SELECT: nesesè paske don.js fè .insert(...).select('id')
-- San sa, Supabase pa ka retounen id don an bay frontend la.
CREATE POLICY "public_can_select_donations_after_insert"
ON public.traposa_donations
FOR SELECT
TO anon, authenticated
USING (true);

-- 8. Admin sèlman ka update/delete don yo
CREATE POLICY "admin_can_update_donations"
ON public.traposa_donations
FOR UPDATE
TO authenticated
USING (is_traposa_admin())
WITH CHECK (is_traposa_admin());

CREATE POLICY "admin_can_delete_donations"
ON public.traposa_donations
FOR DELETE
TO authenticated
USING (is_traposa_admin());

-- 9. Verifye policies yo
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'traposa_donations'
ORDER BY policyname;
