-- ============================================================
-- Fix: Corrigir dados existentes antes de recriar constraint
-- ============================================================

-- 1. Verificar quais valores de level existem atualmente
SELECT DISTINCT level, COUNT(*) 
FROM courses 
GROUP BY level;

-- 2. Se houver valores inválidos, mapear para valores válidos
-- Exemplo: 'basico' -> 'Básico', 'intermediario' -> 'Intermediário', etc.
UPDATE courses SET level = 'Básico' WHERE LOWER(level) IN ('basico', 'básico', 'basic');
UPDATE courses SET level = 'Intermediário' WHERE LOWER(level) IN ('intermediario', 'intermediário', 'intermediate', 'medio');
UPDATE courses SET level = 'Avançado' WHERE LOWER(level) IN ('avancado', 'avançado', 'advanced');
UPDATE courses SET level = 'Especialista' WHERE LOWER(level) IN ('especialista', 'specialist', 'expert');
UPDATE courses SET level = 'Prático' WHERE LOWER(level) IN ('pratico', 'prático', 'practical');
UPDATE courses SET level = 'Reciclagem' WHERE LOWER(level) IN ('reciclagem', 'recycling', 'refresher');
UPDATE courses SET level = 'Integração' WHERE LOWER(level) IN ('integracao', 'integração', 'integration');
UPDATE courses SET level = 'CIPA' WHERE LOWER(level) = 'cipa';

-- 3. Verificar se ainda há valores inválidos
SELECT DISTINCT level 
FROM courses 
WHERE level NOT IN ('Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA');

-- 4. Se a query acima retornar algo, corrija manualmente ou use:
-- UPDATE courses SET level = 'Básico' WHERE level = 'valor_invalido';

-- 5. Agora recriar a constraint
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_level_check;

ALTER TABLE courses 
ADD CONSTRAINT courses_level_check 
CHECK (level IN ('Básico', 'Intermediário', 'Avançado', 'Especialista', 'Prático', 'Reciclagem', 'Integração', 'CIPA'));

-- 6. Verificar
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'courses_level_check';
