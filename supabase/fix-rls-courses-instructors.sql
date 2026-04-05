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
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'super_admin'
  );

-- 3. Instrutores podem inserir cursos (próprios cursos)
CREATE POLICY "courses_insert_instructor"
  ON public.courses
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('instructor', 'teacher')
    AND (NEW.instructor_id = auth.uid() OR NEW.instructor_id IS NULL)
  );

-- 4. Instrutores podem atualizar APENAS seus próprios cursos
CREATE POLICY "courses_update_instructor"
  ON public.courses
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('instructor', 'teacher')
    AND instructor_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('instructor', 'teacher')
    AND instructor_id = auth.uid()
  );

-- 5. Instrutores podem deletar APENAS seus próprios cursos (em status pendente)
CREATE POLICY "courses_delete_instructor"
  ON public.courses
  FOR DELETE
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('instructor', 'teacher')
    AND instructor_id = auth.uid()
    AND is_active = false
  );

-- ============================================================
-- NOTAS:
-- - instructor_id deve ser o UUID do usuário (auth.uid())
-- - Cursos criados por instrutores ficam com is_active = false até aprovação
-- - Super admin pode gerenciar todos os cursos
-- - Após aprovação, apenas super admin pode modificar o curso
-- ============================================================
