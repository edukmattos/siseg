-- ========================================
-- Migration: Adicionar Comissão do Instrutor
-- ========================================
-- Descrição: Adiciona campo para armazenar o valor a ser repassado ao instrutor
-- Data: 2026-04-05

-- Adicionar coluna de comissão do instrutor
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_commission_cents INTEGER DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN courses.instructor_commission_cents IS 'Valor em centavos a ser repassado ao instrutor por matrícula';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'courses' 
  AND column_name = 'instructor_commission_cents';
