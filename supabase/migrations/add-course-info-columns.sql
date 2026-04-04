-- ============================================================================
-- Adicionar colunas de texto para info do curso em order_items
-- Necessário porque course_id pode ser null (cursos mock do carrinho)
-- ============================================================================

-- Adicionar colunas se não existirem
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS course_title TEXT,
  ADD COLUMN IF NOT EXISTS course_nr TEXT,
  ADD COLUMN IF NOT EXISTS course_level TEXT,
  ADD COLUMN IF NOT EXISTS course_modality TEXT;

-- Tornar course_id nullable
ALTER TABLE public.order_items ALTER COLUMN course_id DROP NOT NULL;

-- Remover foreign key constraint se existir
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_course_id_fkey;

-- Verificar alteração
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;
