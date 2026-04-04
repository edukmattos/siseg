-- ============================================================
-- Recriar constraint com valores sem acento (correspondendo ao banco)
-- ============================================================

-- 1. Dropar constraint antiga (se existir)
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- 2. Recriar com valores sem acento (matching existing data)
ALTER TABLE courses 
ADD CONSTRAINT courses_level_check 
CHECK (level IN ('Basico', 'Intermediario', 'Avancado', 'Especialista', 'Pratico', 'Reciclagem', 'Integracao', 'CIPA'));

-- 3. Verificar
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'courses_level_check';
