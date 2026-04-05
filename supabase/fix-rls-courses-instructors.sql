-- ============================================================
-- CORRIGIR RLS DA TABELA COURSES PARA INSTRUTORES
-- Permitir que instrutores criem e gerenciem seus próprios cursos
-- ============================================================

-- Remover todas as políticas existentes da tabela courses
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

-- Habilitar RLS na tabela courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNÇÃO AUXILIAR PARA VERIFICAR SE É INSTRUTOR
-- ============================================================
DROP FUNCTION IF EXISTS public.is_instructor();

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('instructor', 'teacher');
$$;

-- ============================================================
-- FUNÇÃO AUXILIAR PARA VERIFICAR SE É SUPER ADMIN
-- ============================================================
DROP FUNCTION IF EXISTS public.is_super_admin();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin';
$$;

-- ============================================================
-- FUNÇÃO AUXILIAR PARA OBTER O ID DO USUÁRIO (INTEGER) A PARTIR DO UUID
-- ============================================================
DROP FUNCTION IF EXISTS public.get_current_user_id();

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- POLÍTICAS DE ACESSO
-- ============================================================

-- 1. Todos os usuários autenticados podem visualizar cursos
CREATE POLICY "courses_select_authenticated"
  ON public.courses
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 2. Super admin pode fazer qualquer operação em todos os cursos
CREATE POLICY "courses_all_super_admin"
  ON public.courses
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 3. Instrutores podem inserir cursos (se instructor_id for seu próprio ID)
CREATE POLICY "courses_insert_instructor"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
  );

-- 4. Instrutores podem atualizar APENAS seus próprios cursos
CREATE POLICY "courses_update_instructor"
  ON public.courses
  FOR UPDATE
  USING (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
  )
  WITH CHECK (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
  );

-- 5. Instrutores podem deletar APENAS seus próprios cursos (em status pendente)
CREATE POLICY "courses_delete_instructor"
  ON public.courses
  FOR DELETE
  USING (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
    AND is_active = false
  );

-- ============================================================
-- NOTAS:
-- - instructor_id deve ser o UUID do usuário (auth.uid())
-- - Cursos criados por instrutores ficam com is_active = false até aprovação
-- - Super admin pode gerenciar todos os cursos
-- - Após aprovação, apenas super admin pode modificar o curso
-- ============================================================
