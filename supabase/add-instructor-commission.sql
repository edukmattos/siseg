-- Adicionar campo de comissão do instrutor na tabela courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_commission_cents INTEGER;

-- Adicionar comentário explicativo
COMMENT ON COLUMN courses.instructor_commission_cents IS 'Valor em centavos a ser repassado ao instrutor por matrícula';
