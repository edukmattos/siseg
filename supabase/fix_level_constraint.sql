-- ============================================================
-- Fix: Constraint level_check com encoding correto
-- ============================================================

-- 1. Dropar constraint antiga
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- 2. Recriar constraint com valores corretos
ALTER TABLE courses 
ADD CONSTRAINT courses_level_check 
CHECK (level IN ('Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA'));

-- 3. Verificar
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'courses_level_check';
