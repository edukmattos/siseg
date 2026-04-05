-- ============================================================
-- VERIFICAR E CORRIGIR POLÍTICAS RLS DA TABELA COURSES
-- para garantir que Super Admin possa fazer UPDATE
-- ============================================================

-- Ver políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'courses' 
ORDER BY policyname;

-- Se a política courses_all_super_admin não existe ou está incorreta, recriar:
-- (Execute apenas se necessário)

/*
DROP POLICY IF EXISTS "courses_all_super_admin" ON public.courses;

CREATE POLICY "courses_all_super_admin"
  ON public.courses
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );
*/

-- Testar se as funções auxiliares existem
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_instructor', 'is_super_admin', 'get_current_user_id');
