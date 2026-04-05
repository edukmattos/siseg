-- ============================================================
-- CORRIGIR POLÍTICAS RLS PARA PERMITIR ACESSO PÚBLICO
-- ÀS AULAS E MÓDULOS DOS CURSOS ATIVOS
-- ============================================================

-- 1. Política para permitir que qualquer pessoa veja módulos de cursos ativos
DROP POLICY IF EXISTS "course_modules_select_public" ON public.course_modules;
CREATE POLICY "course_modules_select_public"
  ON public.course_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.is_active = true
    )
  );

-- 2. Política para permitir que qualquer pessoa veja aulas de módulos de cursos ativos
DROP POLICY IF EXISTS "course_lessons_select_public" ON public.course_lessons;
CREATE POLICY "course_lessons_select_public"
  ON public.course_lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.is_active = true
    )
  );

-- Nota: As políticas de instrutor e super admin continuam valendo
-- O Supabase usa a primeira política que corresponde (OR logic)
