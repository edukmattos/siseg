-- ============================================================
-- Adicionar coluna status na tabela courses
-- Execute este SQL no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Adicionar coluna status com valor padrão 'pending'
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected', 'draft', 'archived'));

-- 2. Definir status 'approved' para cursos já existentes que estão ativos
UPDATE courses SET status = 'approved' WHERE is_active = true;

-- 3. Definir status 'draft' para cursos existentes que estão inativos  
UPDATE courses SET status = 'draft' WHERE is_active = false;

-- 4. Criar índice para busca rápida por status
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- 5. Comentário na coluna
COMMENT ON COLUMN courses.status IS 'Status do fluxo de aprovação: pending, approved, rejected, draft, archived';
