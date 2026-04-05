-- ============================================================================
-- CONFIGURAÇÃO COMPLETA DE ACESSO PÚBLICO AO CATÁLOGO
-- ============================================================================
-- Executar este SQL uma única vez para permitir que visitantes
-- (não logados) visualizem cursos, módulos e aulas no catálogo.
-- ============================================================================

-- ============================================================
-- 1. POLÍTICAS PARA CURSOS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'courses_select_public_active' 
      AND tablename = 'courses' 
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "courses_select_public_active"
      ON public.courses
      FOR SELECT
      USING ( is_active = true )';
    RAISE NOTICE '✅ Política courses_select_public_active criada!';
  ELSE
    RAISE NOTICE 'ℹ️  Política courses_select_public_active já existe';
  END IF;
END;
$$;

-- ============================================================
-- 2. POLÍTICAS PARA MÓDULOS (course_modules)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'course_modules_select_public' 
      AND tablename = 'course_modules' 
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "course_modules_select_public"
      ON public.course_modules
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.courses c 
          WHERE c.id = course_modules.course_id AND c.is_active = true
        )
      )';
    RAISE NOTICE '✅ Política course_modules_select_public criada!';
  ELSE
    RAISE NOTICE 'ℹ️  Política course_modules_select_public já existe';
  END IF;
END;
$$;

-- ============================================================
-- 3. POLÍTICAS PARA AULAS (lessons)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'lessons_select_public' 
      AND tablename = 'lessons' 
      AND schemaname = 'public'
  ) THEN
    EXECUTE 'CREATE POLICY "lessons_select_public"
      ON public.lessons
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.course_modules cm
          JOIN public.courses c ON c.id = cm.course_id
          WHERE cm.id = lessons.module_id AND c.is_active = true
        )
      )';
    RAISE NOTICE '✅ Política lessons_select_public criada!';
  ELSE
    RAISE NOTICE 'ℹ️  Política lessons_select_public já existe';
  END IF;
END;
$$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT 
  tablename,
  policyname,
  CASE cmd 
    WHEN 'SELECT' THEN '📖 Leitura'
    WHEN 'INSERT' THEN '➕ Inserção'
    WHEN 'UPDATE' THEN '✏️  Atualização'
    WHEN 'DELETE' THEN '🗑️  Exclusão'
    ELSE cmd
  END as tipo,
  qual as condicao
FROM pg_policies 
WHERE tablename IN ('courses', 'course_modules', 'lessons') 
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- TESTE: Verificar se as políticas estão funcionando
-- ============================================================

-- Deve retornar todos os cursos ativos (visíveis para todos)
SELECT id, nr_code, title, is_active 
FROM public.courses 
WHERE is_active = true
LIMIT 5;

-- Deve retornar módulos de cursos ativos
SELECT cm.id, cm.title, c.nr_code as curso
FROM public.course_modules cm
JOIN public.courses c ON c.id = cm.course_id
WHERE c.is_active = true
LIMIT 5;

-- Deve retornar aulas de módulos de cursos ativos
SELECT l.id, l.title, cm.title as modulo
FROM public.lessons l
JOIN public.course_modules cm ON cm.id = l.module_id
JOIN public.courses c ON c.id = cm.course_id
WHERE c.is_active = true
LIMIT 5;
