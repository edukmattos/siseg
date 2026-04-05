-- ============================================================
-- VERIFICAR E CORRIGIR A TABELA COURSES
-- Como a consulta faz um JOIN com courses (course:courses(...)), 
-- se a política de courses usar uma função volátil ou com SET, 
-- o mesmo erro 0A000 será lançado.
-- ============================================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.courses', pol.policyname);
    RAISE NOTICE 'Removida política courses: %', pol.policyname;
  END LOOP;
END;
$$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Cursos costumam ser visíveis para todos os usuários autenticados
CREATE POLICY "courses_select_authenticated"
  ON public.courses
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Super admin pode modificar cursos
CREATE POLICY "courses_all_super_admin"
  ON public.courses
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );
