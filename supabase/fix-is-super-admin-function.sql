-- ============================================================
-- CORRIGIR FUNÇÕES is_super_admin() e is_instructor() PARA USAR A TABELA users
-- ============================================================

-- 1. Dropar TODAS as políticas dependentes primeiro
DROP POLICY IF EXISTS "courses_all_super_admin" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_update_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_select_authenticated" ON public.courses;

-- 2. Dropar funções existentes
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_instructor();
DROP FUNCTION IF EXISTS public.get_current_user_id();

-- 3. Recriar funções usando a tabela users (mais confiável)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE user_uuid = auth.uid()
      AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE user_uuid = auth.uid()
      AND role IN ('instructor', 'teacher')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.users WHERE user_uuid = auth.uid() LIMIT 1;
$$;

-- 4. Habilitar RLS (caso não esteja)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 5. Recriar TODAS as políticas
-- 5.1. Todos os usuários autenticados podem visualizar cursos
CREATE POLICY "courses_select_authenticated"
  ON public.courses
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- 5.2. Super admin pode fazer qualquer operação em todos os cursos
CREATE POLICY "courses_all_super_admin"
  ON public.courses
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 5.3. Instrutores podem inserir cursos
CREATE POLICY "courses_insert_instructor"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
  );

-- 5.4. Instrutores podem atualizar APENAS seus próprios cursos
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

-- 5.5. Instrutores podem deletar APENAS seus próprios cursos (em status pendente)
CREATE POLICY "courses_delete_instructor"
  ON public.courses
  FOR DELETE
  USING (
    public.is_instructor()
    AND instructor_id = public.get_current_user_id()
    AND is_active = false
  );

-- 6. Testar as funções
SELECT 
  auth.uid() as current_user_uuid,
  public.is_super_admin() as is_super_admin,
  public.is_instructor() as is_instructor,
  public.get_current_user_id() as current_user_db_id,
  (SELECT role FROM public.users WHERE user_uuid = auth.uid() LIMIT 1) as actual_role;
