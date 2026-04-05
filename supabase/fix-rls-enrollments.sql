-- ============================================================
-- FIX RLS ENROLLMENTS
-- Este script limpa as políticas da tabela enrollments
-- e cria novas sem referenciar funções que causem erro 0A000
-- ============================================================

-- Remover políticas antigas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'enrollments' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.enrollments', pol.policyname);
    RAISE NOTICE 'Removida política enrollments: %', pol.policyname;
  END LOOP;
END;
$$;

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- O aluno correspondente pode ver suas próprias matrículas
CREATE POLICY "enrollments_select_own"
  ON public.enrollments
  FOR SELECT
  USING (
    user_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
  );

-- Exemplo: Se os donos da empresa puderem ver (descomente caso enrollments tenha company_id)
-- CREATE POLICY "enrollments_select_company"
--   ON public.enrollments
--   FOR SELECT
--   USING (
--     company_id IN (
--       SELECT id FROM public.companies WHERE owner_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
--     )
--   );

-- Super admin pode ver tudo (opcional)
CREATE POLICY "enrollments_select_super_admin"
  ON public.enrollments
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );

-- ============================================================
-- VERIFICAR E CORRIGIR A TABELA CERTIFICATES TAMBÉM
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'certificates' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificates', pol.policyname);
    RAISE NOTICE 'Removida política certificates: %', pol.policyname;
  END LOOP;
END;
$$;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select_own"
  ON public.certificates
  FOR SELECT
  USING (
    user_id = (SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1)
  );

CREATE POLICY "certificates_select_super_admin"
  ON public.certificates
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );
