-- ============================================================================
-- PERMITIR ACESSO PÚBLICO AOS CURSOS ATIVOS
-- ============================================================================
-- Este SQL adiciona uma política para permitir que qualquer pessoa
-- (inclusive não logada) possa visualizar cursos ativos no catálogo.

-- Verificar se a política já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'courses_select_public_active' 
      AND tablename = 'courses' 
      AND schemaname = 'public'
  ) THEN
    -- Adicionar política de acesso público para cursos ativos
    EXECUTE 'CREATE POLICY "courses_select_public_active"
      ON public.courses
      FOR SELECT
      USING ( is_active = true )';
    RAISE NOTICE 'Política courses_select_public_active criada com sucesso!';
  ELSE
    RAISE NOTICE 'Política courses_select_public_active já existe, pulando...';
  END IF;
END;
$$;

-- Verificar políticas existentes
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'courses' 
  AND schemaname = 'public'
ORDER BY policyname;
