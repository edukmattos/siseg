-- ============================================================================
-- PERMITIR ACESSO PÚBLICO AOS MÓDULOS E AULAS
-- ============================================================================
-- Este SQL adiciona políticas para permitir que qualquer pessoa
-- (inclusive não logada) possa visualizar módulos e aulas dos cursos ativos.

-- ============================================================
-- POLÍTICAS PARA course_modules
-- ============================================================

-- Remover políticas existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'course_modules' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.course_modules', pol.policyname);
    RAISE NOTICE 'Removida política course_modules: %', pol.policyname;
  END LOOP;
END;
$$;

-- Política de leitura pública para módulos de cursos ativos
CREATE POLICY "course_modules_select_public"
  ON public.course_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = course_modules.course_id AND c.is_active = true
    )
  );

-- ============================================================
-- POLÍTICAS PARA lessons
-- ============================================================

-- Remover políticas existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'lessons' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.lessons', pol.policyname);
    RAISE NOTICE 'Removida política lessons: %', pol.policyname;
  END LOOP;
END;
$$;

-- Política de leitura pública para aulas de módulos de cursos ativos
CREATE POLICY "lessons_select_public"
  ON public.lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id = lessons.module_id AND c.is_active = true
    )
  );

-- ============================================================
-- VERIFICAR POLÍTICAS CRIADAS
-- ============================================================
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('courses', 'course_modules', 'lessons') 
  AND schemaname = 'public'
ORDER BY tablename, policyname;
