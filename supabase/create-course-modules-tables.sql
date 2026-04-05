-- ============================================================
-- CRIAR TABELAS DE MÓDULOS E AULAS PARA CURSOS
-- ============================================================

-- 1. Limpar tabelas existentes para garantir schema correto
DROP TABLE IF EXISTS public.course_lessons CASCADE;
DROP TABLE IF EXISTS public.course_modules CASCADE;

-- 2. Tabela de Módulos
CREATE TABLE public.course_modules (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Aulas
CREATE TABLE public.course_lessons (
  id BIGSERIAL PRIMARY KEY,
  module_id BIGINT NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video', -- video, pdf, quiz, text
  content_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON public.course_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(module_id, order_index);

-- 4. Habilitar RLS
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para course_modules

-- Instrutores podem ver módulos dos seus cursos
DROP POLICY IF EXISTS "course_modules_select_instructor" ON public.course_modules;
CREATE POLICY "course_modules_select_instructor"
  ON public.course_modules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem inserir módulos nos seus cursos
DROP POLICY IF EXISTS "course_modules_insert_instructor" ON public.course_modules;
CREATE POLICY "course_modules_insert_instructor"
  ON public.course_modules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem atualizar módulos dos seus cursos
DROP POLICY IF EXISTS "course_modules_update_instructor" ON public.course_modules;
CREATE POLICY "course_modules_update_instructor"
  ON public.course_modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem deletar módulos dos seus cursos
DROP POLICY IF EXISTS "course_modules_delete_instructor" ON public.course_modules;
CREATE POLICY "course_modules_delete_instructor"
  ON public.course_modules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_modules.course_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Super admin pode tudo
DROP POLICY IF EXISTS "course_modules_all_super_admin" ON public.course_modules;
CREATE POLICY "course_modules_all_super_admin"
  ON public.course_modules
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 6. Políticas RLS para course_lessons

-- Instrutores podem ver aulas dos seus módulos
DROP POLICY IF EXISTS "course_lessons_select_instructor" ON public.course_lessons;
CREATE POLICY "course_lessons_select_instructor"
  ON public.course_lessons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem inserir aulas nos seus módulos
DROP POLICY IF EXISTS "course_lessons_insert_instructor" ON public.course_lessons;
CREATE POLICY "course_lessons_insert_instructor"
  ON public.course_lessons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem atualizar aulas dos seus módulos
DROP POLICY IF EXISTS "course_lessons_update_instructor" ON public.course_lessons;
CREATE POLICY "course_lessons_update_instructor"
  ON public.course_lessons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Instrutores podem deletar aulas dos seus módulos
DROP POLICY IF EXISTS "course_lessons_delete_instructor" ON public.course_lessons;
CREATE POLICY "course_lessons_delete_instructor"
  ON public.course_lessons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id
        AND courses.instructor_id = public.get_current_user_id()
    )
  );

-- Super admin pode tudo nas aulas
DROP POLICY IF EXISTS "course_lessons_all_super_admin" ON public.course_lessons;
CREATE POLICY "course_lessons_all_super_admin"
  ON public.course_lessons
  FOR ALL
  USING ( public.is_super_admin() )
  WITH CHECK ( public.is_super_admin() );

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON public.course_modules;
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON public.course_lessons;
CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
