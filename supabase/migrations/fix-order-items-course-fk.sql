-- ============================================================================
-- Corrigir foreign key constraint em order_items.course_id
-- O course_id do carrinho pode não existir na tabela courses
-- ============================================================================

-- Remover a constraint de foreign key existente
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_course_id_fkey;

-- Tornar course_id nullable (já que armazenamos info do curso como texto)
ALTER TABLE public.order_items ALTER COLUMN course_id DROP NOT NULL;

-- Verificar alteração
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'course_id';
